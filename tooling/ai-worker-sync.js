#!/usr/bin/env node
/**
 * AI Worker Sync
 *
 * Aggregates results from AI Worker phases and updates GitHub issue/project.
 */

import { Octokit } from "@octokit/rest";
import { trackUsage } from "./ai-usage-tracker.js";

async function main() {
	const issueNumber = process.env.ISSUE_NUMBER;
	const owner = process.env.GITHUB_REPOSITORY_OWNER;
	const repo =
		process.env.GITHUB_REPOSITORY?.split("/")[1] ||
		process.env.GITHUB_REPOSITORY;

	if (!issueNumber || !owner || !repo) {
		console.error(
			"Missing required environment variables (ISSUE_NUMBER, GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY)",
		);
		process.exit(1);
	}

	const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
	const octokit = new Octokit({ auth: token });

	// 1. Process Costs from environment/files
	// In a real scenario, each phase (planning, developer, reviewer)
	// would have saved its tokens to a file or output.
	// For this implementation, we expect them as arguments or environment vars.

	const phases = [
		{
			name: "planning",
			input: process.env.PLANNING_INPUT_TOKENS,
			output: process.env.PLANNING_OUTPUT_TOKENS,
			model: "gemini-2.5-flash-lite",
		},
		{
			name: "developer",
			input: process.env.DEVELOPER_INPUT_TOKENS,
			output: process.env.DEVELOPER_OUTPUT_TOKENS,
			model: "gemini-2.5-flash",
		},
		{
			name: "reviewer",
			input: process.env.REVIEWER_INPUT_TOKENS,
			output: process.env.REVIEWER_OUTPUT_TOKENS,
			model: "gemini-2.5-flash",
		},
	];

	console.log(`Aggregating costs for issue #${issueNumber}...`);

	for (const phase of phases) {
		if (phase.input && phase.output) {
			console.log(`Tracking usage for ${phase.name}...`);
			await trackUsage({
				owner,
				repo,
				issueNumber: parseInt(issueNumber, 10),
				model: phase.model,
				inputTokens: parseInt(phase.input, 10),
				outputTokens: parseInt(phase.output, 10),
				operation: `worker-${phase.name}`,
				octokit,
			});
		}
	}

	console.log("✅ Worker synchronization complete.");
}

main().catch((err) => {
	console.error("❌ Sync Error:", err.message);
	process.exit(1);
});
