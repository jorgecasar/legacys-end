#!/usr/bin/env node
/**
 * AI Worker Sync
 *
 * Aggregates results from AI Worker phases and updates GitHub issue/project.
 */

import { FIELD_IDS, OPTION_IDS } from "./ai-config.js";
import { trackUsage } from "./ai-usage-tracker.js";
import {
	addIssueToProject,
	getIssueNodeId,
	getOctokit,
	updateProjectField,
} from "./github-utils.js";

export async function syncWorkerResults() {
	const issueNumber = process.env.ISSUE_NUMBER;
	const owner = process.env.GITHUB_REPOSITORY_OWNER;
	const repo =
		process.env.GITHUB_REPOSITORY?.split("/")[1] ||
		process.env.GITHUB_REPOSITORY;
	const isFailed = process.argv.includes("--failed");

	if (!issueNumber || !owner || !repo) {
		console.error(
			"Missing required environment variables (ISSUE_NUMBER, GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY)",
		);
		process.exit(1);
	}

	const octokit = getOctokit();

	console.log(`Aggregating results for issue #${issueNumber}...`);

	// 1. Mark as Paused if failed
	if (isFailed) {
		console.log("Worker failed. Marking task as Paused...");

		try {
			const issueNodeId = await getIssueNodeId(octokit, {
				owner,
				repo,
				issueNumber,
			});

			const itemId = await addIssueToProject(octokit, issueNodeId);

			await updateProjectField(
				octokit,
				itemId,
				FIELD_IDS.status,
				OPTION_IDS.status.paused,
			);
			console.log("✅ Task status updated to Paused.");
		} catch (err) {
			console.warn(
				`Warning: Could not update status to Paused: ${err.message}`,
			);
		}
	}

	// 2. Process Costs
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

	for (const phase of phases) {
		const input = Number.parseInt(phase.input, 10);
		const output = Number.parseInt(phase.output, 10);

		if (
			!Number.isNaN(input) &&
			!Number.isNaN(output) &&
			(input > 0 || output > 0)
		) {
			console.log(
				`Tracking usage for ${phase.name} (${input} in / ${output} out)...`,
			);
			await trackUsage({
				owner,
				repo,
				issueNumber: Number.parseInt(issueNumber, 10),
				model: phase.model,
				inputTokens: input,
				outputTokens: output,
				operation: `worker-${phase.name}`,
				octokit,
			});
		}
	}

	console.log("✅ Results synchronization complete.");
}

import { fileURLToPath } from "node:url";

if (import.meta.url === fileURLToPath(import.meta.url)) {
	syncWorkerResults().catch((err) => {
		console.error("❌ Sync Error:", err.message);
		process.exit(1);
	});
}
