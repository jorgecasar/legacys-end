#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import {
	FIELD_IDS,
	OPTION_IDS,
	OWNER,
	REPO,
	writeGitHubOutput,
} from "../config/index.js";
import { runGeminiCLI } from "../gemini/run-cli.js";
import {
	addIssueComment,
	addIssueToProject,
	createSubIssue,
	getIssueNodeId,
	getOctokit,
	hasOpenSubtasks,
	updateProjectField,
} from "../github/index.js";

/** Marker used to identify AI-generated plan comments */
export const PLAN_COMMENT_MARKER = "<!-- AI-PLAN -->";

// Default dependencies bundle
const DEFAULT_DEPS = {
	getOctokit,
	hasOpenSubtasks,
	getIssueNodeId,
	createSubIssue,
	addIssueToProject,
	addIssueComment,
	updateProjectField,
	runGeminiCLI,
	writeGitHubOutput,
};

const PLAN_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your goal is to create precise, execution-ready technical plans for the 'Legacy's End' project.

Project Context:
- Name: Legacy's End
- Type: Web Application / Game
- Stack: Node.js (v24), Lit (Web Components), Vite, Vitest, Playwright.
- Language: JavaScript/TypeScript ONLY.
- Forbidden: Python, Java, C#, or any non-JS backend logic unless explicitly requested for tooling.

Output Requirements:
- Return a JSON object matching this schema:
{
  "methodology": "STRING", // The technical approach or steps (e.g., TDD).
  "slug": "STRING", // URL-friendly branch identifier (kebab-case).
  "files_to_touch": ["STRING"], // List of files that will be created or modified.
  "sub_tasks": [ // Optional decomposition into smaller sub-issues.
    {
      "title": "STRING", // Concise sub-task title.
      "goal": "STRING", // Detailed goal of the sub-task.
      "dependencies": [NUMBER] // List of temporary numeric IDs of other sub-tasks that this task depends on.
    }
  ],
  "needs_decomposition": BOOLEAN // True if the task is complex enough to be split.
}

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

/**
 * Creates multiple sub-issues and links them to the parent.
 * @param {Octokit} octokit
 * @param {number} parentIssueNumber
 * @param {Array<{title: string, goal: string}>} subTasks
 * @param {Object} tools - Injected tools
 * @returns {Promise<Array<Object>>} List of created issues
 */
async function createSubtasksInternal(
	octokit,
	parentIssueNumber,
	subTasks,
	tools,
) {
	const createdIssues = [];
	const parentId = await tools.getIssueNodeId(octokit, {
		owner: OWNER,
		repo: REPO,
		issueNumber: parseInt(parentIssueNumber, 10),
	});

	for (const task of subTasks) {
		// 1. Create Issue
		const { data: issue } = await octokit.rest.issues.create({
			owner: OWNER,
			repo: REPO,
			title: task.title,
			body: task.goal,
		});

		// 2. Link as Sub-issue
		const childId = issue.node_id; // REST API returns node_id
		await tools.createSubIssue(octokit, parentId, childId);

		createdIssues.push(issue);
	}
	return createdIssues;
}

export async function createTechnicalPlan({
	issueNumber = process.env.ISSUE_NUMBER,
	title = process.env.ISSUE_TITLE,
	body = process.env.ISSUE_BODY,
	currentBranch = process.env.CURRENT_BRANCH || "main",
	octokit: injectedOctokit,
	deps = {},
} = {}) {
	// Merge provided deps with defaults
	const tools = { ...DEFAULT_DEPS, ...deps };
	if (!issueNumber || !title) {
		console.error(
			"Error: Missing ISSUE_NUMBER or ISSUE_TITLE environment variables.",
		);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	const octokit = injectedOctokit || tools.getOctokit();

	// Fetch comments for context and check for existing plan
	console.log(`>>> Fetching comments for Issue #${issueNumber}...`);
	let comments = [];
	try {
		const response = await octokit.rest.issues.listComments({
			owner: OWNER,
			repo: REPO,
			issue_number: parseInt(issueNumber, 10),
		});
		comments = response.data;
	} catch (e) {
		console.warn(`Warning: Could not fetch comments: ${e.message}`);
	}

	// Check for existing plan comment
	const existingPlan = comments.find((c) =>
		c.body?.startsWith(PLAN_COMMENT_MARKER),
	);
	if (existingPlan) {
		console.log(
			`>>> Existing plan found in comment #${existingPlan.id}. Skipping LLM call.`,
		);
		const methodologyMatch = existingPlan.body.match(
			/\*\*Methodology:\*\*\s*(.+)/,
		);
		const branchMatch = existingPlan.body.match(/\*\*Branch:\*\*\s*`([^`]+)`/);
		const filesMatch = existingPlan.body.match(/\*\*Files:\*\*\s*(.+)/);

		const methodology = methodologyMatch ? methodologyMatch[1].trim() : "TDD";
		const branchName = branchMatch ? branchMatch[1].trim() : currentBranch;
		const files = filesMatch ? filesMatch[1].trim() : "";

		tools.writeGitHubOutput("methodology", methodology);
		tools.writeGitHubOutput("branch_name", branchName);
		tools.writeGitHubOutput("files", files);
		tools.writeGitHubOutput("needs_decomposition", "false");
		tools.writeGitHubOutput("input_tokens", 0);
		tools.writeGitHubOutput("output_tokens", 0);
		console.log("✅ Planning phase complete (cached).");
		return {
			data: {
				methodology,
				slug: branchName,
				files_to_touch: files.split(" "),
				needs_decomposition: false,
			},
		};
	}

	// Append comments context to body
	const commentContext = comments
		.map((c) => `User: ${c.user.login}\nBody: ${c.body}`)
		.join("\n---\n");
	if (commentContext) {
		body += `\n\nExisting Comments:\n${commentContext}`;
	}

	// Set branch context based on current branch
	let branchInstruction = "";
	if (currentBranch !== "main") {
		console.log(
			`>>> Working on existing branch: ${currentBranch}. Planning remaining work.`,
		);
		branchInstruction = `You are currently on branch '${currentBranch}'. Focus on planning the REMAINING work to complete the task. Evaluate the existing code in this branch and previous planning comments to decide what's left. If a checklist exists in comments or body, mark implemented items as done.`;
	} else {
		console.log(`>>> No existing branch found. Planning from scratch.`);
		branchInstruction = `No existing branch found. Plan the task from the beginning.`;
	}
	body += `\n\nBranch Context:\n${branchInstruction}`;

	// 0. Check Depth / Nesting Level
	const isSubtask = body && /Parent issue: #\d+/i.test(body);
	if (isSubtask) {
		console.log(
			`Issue #${issueNumber} is identified as a sub-task. Disabling further decomposition.`,
		);
	}

	// Check if blocked by open subtasks
	try {
		const count = await tools.hasOpenSubtasks(octokit, {
			owner: OWNER,
			repo: REPO,
			// Fix: Correctly parse issueNumber as integer for GraphQL variables
			issueNumber: parseInt(issueNumber, 10),
		});
		if (count > 0) {
			console.log(
				`Issue #${issueNumber} has ${count} open child issue(s). Skipping planning.`,
			);
			tools.writeGitHubOutput("blocked", "true");
			tools.writeGitHubOutput("needs_decomposition", "false");
			return;
		}
	} catch (err) {
		console.warn(`Warning: Could not verify child issues: ${err.message}`);
	}

	let prompt = PLAN_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{BODY}}", body || "");

	// Append system instructions to prompt
	prompt = `${PLAN_SYSTEM_INSTRUCTION}\n\n${prompt}`;

	if (isSubtask) {
		prompt +=
			"\n\nCRITICAL: This is a child task. DO NOT decompose it further. You MUST return 'needs_decomposition': false.";
	}

	// 3. Generate Plan
	let plan;
	let inputTokens = 0;
	let outputTokens = 0;

	try {
		console.log(`>>> Generating structured plan for issue #${issueNumber}...`);

		const result = await tools.runGeminiCLI(prompt, {
			modelType: "flash",
			yolo: true, // JSON mode
		});

		inputTokens = result.inputTokens;
		outputTokens = result.outputTokens;

		// The CLI tool already returns the parsed JSON object (merged with stats)
		// We just need to extract the plan part.
		const {
			inputTokens: _in,
			outputTokens: _out,
			modelUsed: _m,
			...parsedPlan
		} = result;
		plan = parsedPlan;

		// Force needs_decomposition to false if it was a subtask
		if (isSubtask && plan.needs_decomposition) {
			console.warn(
				"Override: AI tried to decompose a subtask. Forcing needs_decomposition=false.",
			);
			plan.needs_decomposition = false;
			plan.sub_tasks = [];
		}

		tools.writeGitHubOutput("input_tokens", inputTokens);
		tools.writeGitHubOutput("output_tokens", outputTokens);
	} catch (error) {
		console.error("❌ Planning LLM Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	try {
		if (!plan || !plan.slug) {
			console.error("Debug - Plan received:", JSON.stringify(plan, null, 2));
			throw new Error("Invalid plan structure.");
		}

		console.log(`Plan received. Methodology: ${plan.methodology}`);

		// 1. Determine target branch
		if (!plan.needs_decomposition) {
			let branchName = currentBranch;
			if (currentBranch === "main") {
				const branchPrefix = `task/issue-${issueNumber}-`;
				branchName = `${branchPrefix}${plan.slug || "work"}`;
			}

			console.log(`Target branch: ${branchName}`);
			tools.writeGitHubOutput("branch_name", branchName);
		}

		// 2. Decompose into sub-issues if needed
		if (
			plan.sub_tasks &&
			plan.sub_tasks.length > 0 &&
			plan.needs_decomposition
		) {
			console.log(`Decomposing into ${plan.sub_tasks.length} sub-tasks...`);

			const createdIssuesMap = new Map();
			for (const [index, subTask] of plan.sub_tasks.entries()) {
				const tempId = index + 1;
				const created = await createSubtasksInternal(
					octokit,
					issueNumber,
					[subTask],
					tools,
				);
				const newIssue = created[0];
				createdIssuesMap.set(tempId, newIssue);
				console.log(
					`  - Created sub-task #${newIssue.number}: ${newIssue.title}`,
				);
			}

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

			console.log(`Updating parent task #${issueNumber} (Paused, Pro, P1)...`);
			try {
				const nodeId = await tools.getIssueNodeId(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber,
				});
				const itemId = await tools.addIssueToProject(octokit, nodeId);

				await tools.updateProjectField(
					octokit,
					itemId,
					FIELD_IDS.status,
					OPTION_IDS.status.paused,
				);

				await tools.updateProjectField(octokit, itemId, FIELD_IDS.model, "pro");

				await tools.updateProjectField(
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

		// 3. Output for workflow
		tools.writeGitHubOutput("methodology", plan.methodology || "TDD");
		tools.writeGitHubOutput("files", (plan.files_to_touch || []).join(" "));
		tools.writeGitHubOutput(
			"needs_decomposition",
			plan.needs_decomposition ? "true" : "false",
		);

		// 4. Post plan as comment with marker for future detection
		try {
			const branchName =
				currentBranch === "main"
					? `task/issue-${issueNumber}-${plan.slug || "work"}`
					: currentBranch;
			const planComment = `${PLAN_COMMENT_MARKER}
## 🗺️ AI Plan
**Methodology:** ${plan.methodology || "TDD"}
**Branch:** \`${branchName}\`
**Files:** ${(plan.files_to_touch || []).join(", ")}
**Decomposition:** ${plan.needs_decomposition ? "Yes" : "No"}`;

			await tools.addIssueComment(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber: parseInt(issueNumber, 10),
				body: planComment,
			});
			console.log("📝 Plan comment posted to issue.");
		} catch (err) {
			console.warn(`Warning: Could not post plan comment: ${err.message}`);
		}

		console.log("✅ Planning phase complete.");
		return { data: plan };
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
