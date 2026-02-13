#!/usr/bin/env node
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
	FIELD_IDS,
	OPTION_IDS,
	OWNER,
	REPO,
	writeGitHubOutput,
} from "../config/index.js";
import { runWithFallback } from "../gemini/index.js";
import { createSubtasks } from "../github/client.js";
import {
	addIssueToProject,
	getIssueNodeId,
	getOctokit,
	hasOpenSubtasks,
	updateProjectField,
} from "../github/index.js";

const PLAN_SCHEMA = {
	type: "OBJECT",
	description: "A technical plan for solving a specific GitHub issue.",
	properties: {
		methodology: {
			type: "STRING",
			description: "The technical approach or steps (e.g., TDD).",
		},
		slug: {
			type: "STRING",
			description: "URL-friendly branch identifier.",
		},
		files_to_touch: {
			type: "ARRAY",
			items: { type: "STRING" },
			description: "List of files that will be created or modified.",
		},
		sub_tasks: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					title: { type: "STRING", description: "Concise sub-task title." },
					goal: {
						type: "STRING",
						description: "Detailed goal of the sub-task.",
					},
				},
				required: ["title", "goal"],
			},
			description: "Optional decomposition into smaller sub-issues.",
		},
		needs_decomposition: {
			type: "BOOLEAN",
			description: "True if the task is complex enough to be split.",
		},
	},
	required: ["methodology", "slug", "files_to_touch", "needs_decomposition"],
};

const PLAN_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your goal is to create precise, execution-ready technical plans.

Output Requirements:
- Return a JSON object matching the required schema.
- methodology: Describe the TDD approach.
- slug: use kebab-case for the branch name (e.g., 'fix-auth-logic').
- files_to_touch: Mention ALL files involved.
- decomposition: Only suggest sub-tasks if the issue is high-complexity.`;

const PLAN_PROMPT = `Create a technical plan for:
Issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}
Body:
{{BODY}}`;

export async function createTechnicalPlan({
	issueNumber = process.env.ISSUE_NUMBER,
	title = process.env.ISSUE_TITLE,
	body = process.env.ISSUE_BODY,
	octokit: injectedOctokit,
} = {}) {
	if (!issueNumber || !title) {
		console.error(
			"Error: Missing ISSUE_NUMBER or ISSUE_TITLE environment variables.",
		);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	const octokit = injectedOctokit || getOctokit();

	// Before generating a plan, check if the issue has open child/sub-issues
	try {
		const count = await hasOpenSubtasks(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber,
		});
		if (count > 0) {
			console.log(
				`Issue #${issueNumber} has ${count} open child issue(s). Skipping planning.`,
			);
			writeGitHubOutput("blocked", "true");
			writeGitHubOutput("blocked_children", String(count));
			// Ensure workflow outputs exist and indicate no decomposition
			writeGitHubOutput("needs_decomposition", "false");
			writeGitHubOutput("methodology", "");
			writeGitHubOutput("files", "");
			return {
				data: {
					methodology: null,
					slug: null,
					needs_decomposition: false,
					blocked: true,
				},
			};
		}
	} catch (err) {
		console.warn(`Warning: Could not verify child issues: ${err.message}`);
	}

	const prompt = PLAN_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{BODY}}", body || "");

	// 3. Generate Plan
	let result;
	try {
		console.log(`>>> Generating structured plan for issue #${issueNumber}...`);
		result = await runWithFallback("flash", prompt, {
			systemInstruction: PLAN_SYSTEM_INSTRUCTION,
			responseSchema: PLAN_SCHEMA,
		});

		// Write tokens immediately so they aren't lost if later steps fail
		writeGitHubOutput("input_tokens", result.inputTokens);
		writeGitHubOutput("output_tokens", result.outputTokens);
	} catch (error) {
		console.error("❌ Planning LLM Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	try {
		const plan = result.data;

		if (!plan || !plan.slug) {
			console.error("Debug - Plan received:", JSON.stringify(plan, null, 2));
			throw new Error("Invalid plan structure.");
		}

		console.log(`Plan received. Methodology: ${plan.methodology}`);

		// 1. Create a task branch (Only if NOT decomposing)
		if (!plan.needs_decomposition) {
			const branchName = `task/issue-${issueNumber}-${plan.slug || "work"}`;
			console.log(`Creating branch ${branchName}...`);
			try {
				execSync(`git checkout -b ${branchName}`);
			} catch (_) {
				execSync(`git checkout ${branchName}`);
			}

			// Push the branch immediately
			try {
				execSync(`git push -u origin ${branchName}`);
			} catch (pushErr) {
				console.warn(
					`Warning: Could not push branch ${branchName}: ${pushErr.message}`,
				);
			}
		}

		// 2. Decompose into sub-issues if needed
		if (
			plan.sub_tasks &&
			plan.sub_tasks.length > 0 &&
			plan.needs_decomposition
		) {
			console.log(`Decomposing into ${plan.sub_tasks.length} sub-tasks...`);
			const created = await createSubtasks(
				octokit,
				issueNumber,
				plan.sub_tasks,
			);
			for (const sub of created) {
				console.log(`  - Created sub-task #${sub.number}: ${sub.title}`);
			}

			// 3. Mark parent as Paused and Upgrade Complexity
			console.log(`Updating parent task #${issueNumber} (Paused, Pro, P1)...`);
			try {
				const nodeId = await getIssueNodeId(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber,
				});
				const itemId = await addIssueToProject(octokit, nodeId);

				// Status -> Paused
				await updateProjectField(
					octokit,
					itemId,
					FIELD_IDS.status,
					OPTION_IDS.status.paused,
				);

				// Model -> pro
				await updateProjectField(octokit, itemId, FIELD_IDS.model, "pro");

				// Priority -> P1 (High)
				await updateProjectField(
					octokit,
					itemId,
					FIELD_IDS.priority,
					OPTION_IDS.priority.p1,
				);

				console.log(
					`✓ Task #${issueNumber} updated: Status=Paused, Model=Pro, Priority=P1.`,
				);
			} catch (err) {
				console.warn(
					`Warning: Could not update parent task fields: ${err.message}`,
				);
			}
		}

		// 3. Output for workflow remaining signals
		writeGitHubOutput("methodology", plan.methodology || "TDD");
		writeGitHubOutput("files", (plan.files_to_touch || []).join(" "));
		writeGitHubOutput(
			"needs_decomposition",
			plan.needs_decomposition ? "true" : "false",
		);

		console.log("✅ Planning phase complete.");
		return result;
	} catch (error) {
		console.error("❌ Planning Post-Processing Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	createTechnicalPlan().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
