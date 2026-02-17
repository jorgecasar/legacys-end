#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import * as configModule from "../config/index.js";
import * as geminiModule from "../gemini/run-cli.js";
import * as githubModule from "../github/index.js";

/**
 * Planning Phase using Gemini CLI
 * @param {Object} [deps={}] - Injected dependencies
 */
export async function runPlanningAgent(deps = {}) {
	const {
		runGeminiCLI = geminiModule.runGeminiCLI,
		writeGitHubOutput = configModule.writeGitHubOutput,
		getOctokit = githubModule.getOctokit,
		getIssue = githubModule.getIssue,
		addIssueComment = githubModule.addIssueComment,
		OWNER = configModule.OWNER,
		REPO = configModule.REPO,
		env = process.env,
	} = deps;

	const issueNumber = env.ISSUE_NUMBER;
	let title = env.ISSUE_TITLE;
	let body = env.ISSUE_BODY;

	if (!issueNumber) {
		console.error("Missing required environment variable ISSUE_NUMBER.");
		if (env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	// Auto-fetch details if missing
	if (!title || !body) {
		console.log(`>>> Fetching details for Issue #${issueNumber}...`);
		try {
			const octokit = getOctokit();
			const issue = await getIssue(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber: parseInt(issueNumber),
			});
			title = issue.title;
			body = issue.body;
		} catch (e) {
			console.error(`❌ Could not fetch issue details: ${e.message}`);
			if (env.NODE_ENV !== "test") process.exit(1);
			return;
		}
	}

	const prompt = `
Plan the solution for Issue #${issueNumber}.
TITLE: ${title}
BODY: ${body}

ACTIONS TO PERFORM:
1. Use the '/planner' subagent to determine the strategy.
2. If the task is too large AND requires at least 2 distinct sub-tasks, you MUST CREATE native sub-issues on GitHub.
   - Do NOT decompose if the result is a single sub-issue. Execute it directly in the current issue.
   FOR EACH SUB-ISSUE:
   - Use the atomic script: 'node tooling/github/create-and-link-subissue.js ${issueNumber} "TITLE" "BODY"'.
   - This script creates the issue AND links it natively in one step.
   - Body MUST include a detailed "Goal", "Technical Steps", and "Acceptance Criteria".
3. If creating files:
   - Use '.js' extension (ESM). NO '.ts'.
   - DO NOT create empty files. Provide meaningful boilerplate (imports, class/function structure, JSDoc).
4. If you decompose, set the parent status to 'Paused' in the project board.
5. If not decomposing, create the technical branch 'task/issue-${issueNumber}-slug'.
6. CRITICAL: Your final response MUST include:
   "output:needs_decomposition=true/false"
   "output:methodology=your technical approach"
   "output:files=list of files to touch"

Do not finish until all GitHub actions (creation/updates/file-writing) are complete.
`;

	console.log(`>>> Launching Planning Agent for #${issueNumber}...`);

	try {
		const result = await runGeminiCLI(prompt, {
			modelType: "flash",
			yolo: true,
			inputTokenBudget: parseInt(env.PLANNING_TOKEN_BUDGET || "100000"),
		});

		writeGitHubOutput("input_tokens", result.inputTokens);
		writeGitHubOutput("output_tokens", result.outputTokens);

		// Persist the plan to a comment
		if (result.response) {
			const planComment = `🤖 **AI Plan for #${issueNumber}**\n\n${result.response}`;
			try {
				const octokit = getOctokit();
				await addIssueComment(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber: parseInt(issueNumber),
					body: planComment,
				});
				console.log(">>> Plan persisted to issue comment.");
			} catch (err) {
				console.error("⚠️ Failed to post plan comment:", err.message);
			}
		}

		console.log(">>> Planning phase complete.");
	} catch (error) {
		console.error("❌ Planning Agent Error:", error.message);
		if (env.NODE_ENV !== "test") process.exit(1);
	}
}

// Named handler to achieve 100% function coverage
export function handleFatalError(err) {
	console.error(err);
	process.exit(1);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	runPlanningAgent().catch(handleFatalError);
}
