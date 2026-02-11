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
	const isFailed = process.argv.includes("--failed");

	if (!issueNumber || !owner || !repo) {
		console.error(
			"Missing required environment variables (ISSUE_NUMBER, GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY)",
		);
		process.exit(1);
	}

	const token = process.env.GH_TOKEN;
	const octokit = new Octokit({ auth: token });

	console.log(`Aggregating results for issue #${issueNumber}...`);

	// 1. Mark as Paused if failed
	if (isFailed) {
		console.log("Worker failed. Marking task as Paused...");
		const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
		const STATUS_FIELD_ID = "PVTSSF_lAHOAA562c4BOtC-zg9U7KE";
		const PAUSED_OPTION_ID = "8842b2d9";

		try {
			// Get the item ID first
			const { data: issue } = await octokit.rest.issues.get({
				owner,
				repo,
				issue_number: Number.parseInt(issueNumber, 10),
			});
			const issueNodeId = issue.node_id;

			const addResult = await octokit.graphql(
				`mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
            item { id }
          }
        }`,
				{ projectId: PROJECT_ID, contentId: issueNodeId },
			);

			const itemId = addResult.addProjectV2ItemById.item.id;

			await octokit.graphql(
				`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: { singleSelectOptionId: $optionId }
          }) {
            projectV2Item { id }
          }
        }`,
				{
					projectId: PROJECT_ID,
					itemId,
					fieldId: STATUS_FIELD_ID,
					optionId: PAUSED_OPTION_ID,
				},
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

main().catch((err) => {
	console.error("❌ Sync Error:", err.message);
	process.exit(1);
});
