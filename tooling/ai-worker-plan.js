import { execSync } from "node:child_process";

/**
 * Main function to execute AI worker plan based on issue and plan JSON.
 * This script automates the initial steps of an AI-driven workflow,
 * including branch creation and sub-task decomposition.
 *
 * @param {string} [issueNumber] - The GitHub issue number to work on. Defaults to process.env.ISSUE_NUMBER.
 * @param {string} [planJson] - JSON string containing the execution plan. Expected format: {"methodology": "TDD", "slug": "test-feature"}.
 * @param {object} [options] - Configuration options.
 * @param {Function} [options.exec] - Function to execute shell commands. Defaults to execSync.
 * @returns {Promise<void>} - Promise that resolves when execution completes or rejects on error.
 *
 * @throws {Error} - Throws an error if required arguments (issueNumber or planJson) are missing.
 *
 * @example
 * // Example usage with environment variables
 * ISSUE_NUMBER=123 node tooling/ai-worker-plan.js '{"methodology":"TDD","slug":"test-feature"}'
 *
 * @example
 * // Example usage with custom exec function
 * await main('456', '{"methodology":"TDD"}', { exec: myCustomExec })
 */
export async function main(
	issueNumber = process.env.ISSUE_NUMBER,
	planJson = process.argv[2],
	{ exec = execSync } = {},
) {
	if (!issueNumber || !planJson || planJson.trim() === "") {
		console.error("Error: Missing arguments.");
		console.error(
			"Usage: ISSUE_NUMBER=<number> node tooling/ai-worker-plan.js '<plan_json>'",
		);
		console.error(
			'Example: ISSUE_NUMBER=123 node tooling/ai-worker-plan.js \'{"methodology":"TDD", "slug":"test-feature"}\'',
		);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	// Strip markdown code blocks if present
	const cleanJson = planJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
	const plan = JSON.parse(cleanJson);
	console.log(`Starting execution for issue #${issueNumber}`);
	console.log(`Methodology: ${plan.methodology}`);

	// 1. Create a task branch if not exists
	const branchName = `task/issue-${issueNumber}-${plan.slug || "work"}`;
	try {
		exec(`git checkout -b ${branchName}`);
	} catch (_) {
		exec(`git checkout ${branchName}`);
	}

	// 2. If sub-tasks are defined as NEEDING new issues, create them
	if (plan.sub_tasks && plan.sub_tasks.length > 0 && plan.needs_decomposition) {
		console.log("Decomposing into sub-issues...");
		for (const sub of plan.sub_tasks) {
			const createCmd = `gh issue create --title "${sub.title}" --body "Sub-task of #${issueNumber}. \n\nGoal: ${sub.goal}" --label "sub-task"`;
			exec(createCmd);
		}
	}

	// 3. Output plan for next step in the workflow
	console.log("PLAN_READY=true");
}

import { fileURLToPath } from "node:url";

/**
 * Script entry point.
 * Executes the main function if this file is run directly.
 * Handles errors and exits with appropriate status code.
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
