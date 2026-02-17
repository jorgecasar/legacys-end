#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import * as configModule from "../config/index.js";
import * as geminiModule from "../gemini/run-cli.js";
import * as githubModule from "../github/index.js";

/**
 * Development Phase using Gemini CLI
 * @param {Object} [deps={}] - Injected dependencies
 */
export async function runDevelopmentAgent(deps = {}) {
	const {
		runGeminiCLI = geminiModule.runGeminiCLI,
		writeGitHubOutput = configModule.writeGitHubOutput,
		getOctokit = githubModule.getOctokit,
		getIssue = githubModule.getIssue,
		OWNER = configModule.OWNER,
		REPO = configModule.REPO,
		env = process.env,
	} = deps;

	const issueNumber = env.ISSUE_NUMBER;
	let title = env.ISSUE_TITLE;
	let body = env.ISSUE_BODY;
	const methodology = env.METHODOLOGY;
	const files = env.FILES;

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
				issueNumber: parseInt(issueNumber, 10),
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
Solve Issue #${issueNumber}.
TITLE: ${title}
BODY: ${body}

PLAN:
${methodology}

FILES:
${files}

1. Implement changes using project conventions (JavaScript, Lit, Clean Architecture).
2. Use Serena's symbolic tools for efficient code navigation and editing.
3. Run 'npm test' to verify.
4. CRITICAL: Generate a Conventional Commit message and save it to '.github/AI_COMMIT_MESSAGE'.
   - VALIDATE IT: After writing, you MUST run 'npx commitlint --edit .github/AI_COMMIT_MESSAGE'.
   - If it fails, you MUST fix the message and re-validate until it passes.
5. COMMITTING & PUSHING:
   - PRE-COMMIT: Run 'npm run lint' (or 'npm run format') AND 'npm run test:app && npm run test:tooling' to ensure code quality.
   - ATTEMPT 1: Run 'git commit -F .github/AI_COMMIT_MESSAGE'.
   - IF HOOKS/TESTS FAIL: Read the error message. If you can't easily fix it, YOU MUST RUN:
     'git commit -F .github/AI_COMMIT_MESSAGE --no-verify'
     (We prefer saving the work over losing it, even if tests/lint fail).
   - ATTEMPT 2: Run 'git push -u origin HEAD'.
   - IF PUSH FAILS (e.g. strict server hooks): Run 'git push -u origin HEAD --no-verify'.
   - This step is MANDATORY. Do not finish until the code is committed and pushed.
`;

	console.log(`>>> Launching Development Agent for #${issueNumber}...`);

	try {
		const result = await runGeminiCLI(prompt, {
			modelType: "pro",
			yolo: true,
			inputTokenBudget: parseInt(env.DEVELOPER_TOKEN_BUDGET || "200000", 10),
		});

		writeGitHubOutput("input_tokens", result.inputTokens);
		writeGitHubOutput("output_tokens", result.outputTokens);

		console.log(">>> Gemini CLI execution finished.");
	} catch (error) {
		console.error("❌ Gemini CLI Error:", error.message);
		if (env.NODE_ENV !== "test") process.exit(1);
	}
}

// Named handler to achieve 100% function coverage
export function handleFatalError(err) {
	console.error(err);
	process.exit(1);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	runDevelopmentAgent().catch(handleFatalError);
}
