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
					dependencies: {
						type: "ARRAY",
						items: { type: "NUMBER" },
						description:
							"List of temporary numeric IDs of other sub-tasks that this task depends on.",
					},
				},
				required: ["title", "goal", "dependencies"],
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

const PLAN_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your goal is to create precise, execution-ready technical plans for the 'Legacy's End' project.

Project Context:
- Name: Legacy's End
- Type: Web Application / Game
- Stack: Node.js (v24), Lit (Web Components), Vite, Vitest, Playwright.
- Language: JavaScript/TypeScript ONLY.
- Forbidden: Python, Java, C#, or any non-JS backend logic unless explicitly requested for tooling.

Output Requirements:
- Return a JSON object matching the required schema.
- methodology: Describe the TDD approach.
- slug: use kebab-case for the branch name (e.g., 'fix-auth-logic').
- files_to_touch: Mention ALL files involved.

Decomposition Criteria (STRICT):
- ONLY decompose if the task requires modifying >5 distinct files OR involves multiple distinct logical domains (e.g., backend API + frontend UI + database migration).
- DO NOT decompose if the task is "implement interface", "add type", "create simple component", or "refactor function".
- DO NOT decompose if the task is already a sub-task (check title context).
- If the task can be completed in < 200 lines of code change, DO NOT decompose.`;

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

	// 0. Check Depth / Nesting Level
	// If the body contains "Parent issue: #...", it's already a subtask.
	// We do NOT want to decompose subtasks further to avoid deep nesting.
	const isSubtask = body && /Parent issue: #\d+/i.test(body);
	if (isSubtask) {
		console.log(
			`Issue #${issueNumber} is identified as a sub-task. Disabling further decomposition.`,
		);
	}

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

		// If it's a subtask, force the AI to NOT decompose by modifying the prompt or instructions
		let instructions = PLAN_SYSTEM_INSTRUCTION;
		if (isSubtask) {
			instructions +=
				"\n\nCRITICAL: This is a child task. DO NOT decompose it further. You MUST return 'needs_decomposition': false.";
		}

		result = await runWithFallback("flash", prompt, {
			systemInstruction: instructions,
			responseSchema: PLAN_SCHEMA,
		});

		// Force needs_decomposition to false if it was a subtask (safety net)
		if (isSubtask && result.data.needs_decomposition) {
			console.warn(
				"Override: AI tried to decompose a subtask. Forcing needs_decomposition=false.",
			);
			result.data.needs_decomposition = false;
			result.data.sub_tasks = [];
		}

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

		// 1. Create or Checkout task branch (Only if NOT decomposing)
		if (!plan.needs_decomposition) {
			const branchPrefix = `task/issue-${issueNumber}-`;
			let branchName = `${branchPrefix}${plan.slug || "work"}`;

			console.log(
				`Checking for existing branches starting with ${branchPrefix}...`,
			);
			try {
				// Fetch branches to ensure we see remotes
				execSync("git fetch origin");
				const branches = execSync(
					`git branch -r --list "origin/${branchPrefix}*"`,
					{
						encoding: "utf8",
					},
				);

				if (branches.trim()) {
					// Branch exists! Use the first one found.
					const existingBranch = branches
						.split("\n")[0]
						.trim()
						.replace("origin/", "");
					console.log(`Found existing branch: ${existingBranch}. Using it.`);
					branchName = existingBranch;

					// Checkout and track remote
					try {
						execSync(`git checkout ${branchName}`);
						execSync(`git pull --rebase origin ${branchName}`);
					} catch (e) {
						// If local branch doesn't exist but remote does
						execSync(`git checkout -b ${branchName} origin/${branchName}`);
					}
				} else {
					// Create new branch
					console.log(`Creating new branch ${branchName}...`);
					try {
						execSync(`git checkout -b ${branchName}`);
						execSync(`git push -u origin ${branchName}`);
					} catch (e) {
						// Fallback if branch exists locally but not remote (rare edge case here)
						execSync(`git checkout ${branchName}`);
					}
				}
			} catch (err) {
				console.warn(
					`Warning: Branch detection failed, falling back to new branch creation: ${err.message}`,
				);
				try {
					execSync(`git checkout -b ${branchName}`);
				} catch (_) {
					execSync(`git checkout ${branchName}`);
				}
			}
		}

		// 2. Decompose into sub-issues if needed
		if (
			plan.sub_tasks &&
			plan.sub_tasks.length > 0 &&
			plan.needs_decomposition
		) {
			console.log(`Decomposing into ${plan.sub_tasks.length} sub-tasks...`);

			// Step 1: Create all issues first to get their numbers
			const createdIssuesMap = new Map();
			for (const [index, subTask] of plan.sub_tasks.entries()) {
				const tempId = index + 1; // Assuming 1-based temp IDs from LLM
				const created = await createSubtasks(octokit, issueNumber, [subTask]);
				const newIssue = created[0];
				createdIssuesMap.set(tempId, newIssue);
				console.log(
					`  - Created sub-task #${newIssue.number}: ${newIssue.title}`,
				);
			}

			// Step 2: Link issues with dependencies
			console.log("Linking sub-task dependencies...");
			for (const [tempId, issue] of createdIssuesMap.entries()) {
				const subTask = plan.sub_tasks[tempId - 1];
				if (subTask.dependencies && subTask.dependencies.length > 0) {
					const blockers = subTask.dependencies
						.map((depId) => {
							const blockerIssue = createdIssuesMap.get(depId);
							return blockerIssue ? `#${blockerIssue.number}` : null;
						})
						.filter(Boolean);

					if (blockers.length > 0) {
						const newBody = `${issue.body}\n\nBlocked by ${blockers.join(", ")}`;
						await octokit.rest.issues.update({
							owner: OWNER,
							repo: REPO,
							issue_number: issue.number,
							body: newBody,
						});
						console.log(
							`  - Issue #${issue.number} is now blocked by ${blockers.join(", ")}`,
						);
					}
				}
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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	createTechnicalPlan().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
