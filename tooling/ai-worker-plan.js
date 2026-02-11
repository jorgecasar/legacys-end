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
		/**
		 * Validates required arguments and displays usage information.
		 *
		 * @description
		 * Ensures that both issueNumber and planJson are provided and non-empty.
		 * If validation fails, displays error message with usage examples and exits.
		 *
		 * @type {ValidationStep}
		 *
		 * @example
		 * // Missing arguments - will exit with error
		 * node tooling/ai-worker-plan.js
		 *
		 * @example
		 * // Valid execution
		 * ISSUE_NUMBER=123 node tooling/ai-worker-plan.js '{"methodology":"TDD"}'
		 */
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

	/**
	 * Parses and cleans JSON plan from input string.
	 *
	 * @description
	 * Removes markdown code block markers (```json ... ```) from the input
	 * string before parsing. This allows plans to be copy-pasted from markdown
	 * documentation or AI chat responses.
	 *
	 * @type {PlanParsingStep}
	 * @param {string} planJson - Raw plan string, potentially wrapped in markdown code blocks.
	 * @returns {Plan} - Parsed plan object with methodology and optional fields.
	 *
	 * @example
	 * // Input with markdown
	 * '```json\n{"methodology":"TMD"}\n```'
	 *
	 * // Output
	 * { methodology: "TDD" }
	 */
	const cleanJson = planJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
	const plan = JSON.parse(cleanJson);
	console.log(`Starting execution for issue #${issueNumber}`);
	console.log(`Methodology: ${plan.methodology}`);

	/**
	 * Creates or checks out a task branch for the issue.
	 *
	 * @description
	 * Generates a branch name following the pattern `task/issue-{issueNumber}-{slug}`.
	 * Attempts to create the branch first; if it already exists, checks it out instead.
	 *
	 * @type {BranchCreationStep}
	 * @param {number} issueNumber - The GitHub issue number.
	 * @param {Plan} plan - The parsed plan object containing optional slug.
	 * @returns {string} branchName - The name of the created/checked-out branch.
	 *
	 * @example
	 * // Creates branch "task/issue-123-test-feature"
	 * // when plan.slug is "test-feature"
	 */
	const branchName = `task/issue-${issueNumber}-${plan.slug || "work"}`;
	try {
		exec(`git checkout -b ${branchName}`);
	} catch (_) {
		exec(`git checkout ${branchName}`);
	}

	/**
	 * Decomposes main task into sub-issues if required.
	 *
	 * @description
	 * Creates GitHub issues for each sub-task defined in the plan.
	 * Each sub-issue is linked back to the parent issue number.
	 * Only executes if needs_decomposition is true and sub_tasks array is non-empty.
	 *
	 * @type {TaskDecompositionStep}
	 * @param {number} issueNumber - The parent GitHub issue number.
	 * @param {Plan} plan - The parsed plan object containing sub_tasks and needs_decomposition.
	 *
	 * @example
	 * // Creates sub-issues for "design" and "implementation"
	 * // if plan.needs_decomposition is true
	 * // Each sub-issue includes "Sub-task of #{issueNumber}" in body
	 */
	if (plan.sub_tasks && plan.sub_tasks.length > 0 && plan.needs_decomposition) {
		console.log("Decomposing into sub-issues...");
		for (const sub of plan.sub_tasks) {
			const createCmd = `gh issue create --title "${sub.title}" --body "Sub-task of #${issueNumber}. \n\nGoal: ${sub.goal}" --label "sub-task"`;
			exec(createCmd);
		}
	}

	/**
	 * Marks the plan as ready for next workflow step.
	 *
	 * @description
	 * Outputs PLAN_READY=true to indicate that initial setup is complete
	 * and the workflow can proceed to the next phase (e.g., implementation).
	 *
	 * @type {CompletionStep}
	 *
	 * @example
	 * // Console output
	 * // PLAN_READY=true
	 */
	console.log("PLAN_READY=true");
}

import { fileURLToPath } from "node:url";

/**
 * Script entry point guard.
 *
 * @description
 * Checks if this file is being executed directly (vs. being imported as a module).
 * If executed directly, invokes the main function and handles any errors.
 *
 * @type {EntryPointGuard}
 * @param {string} process.argv[1] - The path of the script being executed.
 * @param {string} import.meta.url - The URL of the current module.
 * @returns {void} - No return value; exits process on completion or error.
 *
 * @example
 * // Direct execution - will run main()
 * node tooling/ai-worker-plan.js '{"methodology":"TMD"}'
 *
 * @example
 * // Imported as module - will not execute main()
 * import { main } from './ai-worker-plan.js'
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		/**
		 * Error handler for direct script execution.
		 *
		 * @description
		 * Catches any errors from the main function, logs them to stderr,
		 * and exits with status code 1 to indicate failure.
		 *
		 * @type {ErrorHandler}
		 * @param {Error} err - The error thrown from main function.
		 */
		console.error(err);
		process.exit(1);
	});
}
