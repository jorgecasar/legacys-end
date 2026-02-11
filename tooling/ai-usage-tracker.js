#!/usr/bin/env node
/**
 * AI Usage Tracker
 *
 * Tracks token usage and costs for AI operations on GitHub issues.
 * Accumulates metrics across multiple executions and posts reports as comments.
 */

import { Octokit } from "@octokit/rest";
import { calculateCost } from "./gemini-pricing.js";

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const COST_FIELD_ID = "PVTF_lAHOAA562c4BOtC-zg9hBOw";

/**
 * @typedef {Object} Operation
 * @property {string} operation - Operation name (e.g., 'triage', 'orchestrator', 'worker')
 * @property {string} model - Model used
 * @property {number} inputTokens - Input tokens consumed
 * @property {number} outputTokens - Output tokens consumed
 * @property {number} cost - Cost in USD
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} UsageMetrics
 * @property {number} totalInputTokens - Total input tokens across all operations
 * @property {number} totalOutputTokens - Total output tokens across all operations
 * @property {number} totalCost - Total cost in USD
 * @property {Operation[]} operations - List of operations
 */

/**
 * Track AI usage for an issue
 *
 * @param {Object} params
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @param {string} params.model - Model used
 * @param {number} params.inputTokens - Input tokens
 * @param {number} params.outputTokens - Output tokens
 * @param {string} params.operation - Operation name
 * @param {Octokit} [params.octokit] - Octokit instance (optional)
 * @returns {Promise<UsageMetrics>} Accumulated metrics
 */
export async function trackUsage({
	owner,
	repo,
	issueNumber,
	model,
	inputTokens,
	outputTokens,
	operation,
	octokit,
}) {
	// Initialize Octokit if not provided
	if (!octokit) {
		const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
		if (!token) {
			throw new Error("GH_TOKEN or GITHUB_TOKEN environment variable required");
		}
		octokit = new Octokit({ auth: token });
	}

	// 1. Calculate costs
	const cost = calculateCost(model, inputTokens, outputTokens);

	// 2. Get existing metrics from issue
	const existing = await getExistingMetrics(octokit, owner, repo, issueNumber);

	// 3. Accumulate totals
	const accumulated = {
		totalInputTokens: existing.totalInputTokens + inputTokens,
		totalOutputTokens: existing.totalOutputTokens + outputTokens,
		totalCost: existing.totalCost + cost.totalCost,
		operations: [
			...existing.operations,
			{
				operation,
				model,
				inputTokens,
				outputTokens,
				cost: cost.totalCost,
				timestamp: new Date().toISOString(),
			},
		],
	};

	// 4. Update Project Cost Field (Cumulative)
	await updateProjectCost(
		octokit,
		owner,
		repo,
		issueNumber,
		accumulated.totalCost,
	);

	// 5. Post/update usage comment
	await postUsageComment(octokit, owner, repo, issueNumber, accumulated);

	return accumulated;
}

/**
 * Get existing metrics from issue comments
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueNumber
 * @returns {Promise<UsageMetrics>}
 */
async function getExistingMetrics(octokit, owner, repo, issueNumber) {
	try {
		const { data: comments } = await octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: issueNumber,
		});

		const metricsComment = comments.find((c) =>
			c.body.includes("<!-- AI_USAGE_METRICS -->"),
		);

		if (!metricsComment) {
			return {
				totalInputTokens: 0,
				totalOutputTokens: 0,
				totalCost: 0,
				operations: [],
			};
		}

		// Parse JSON from comment
		const match = metricsComment.body.match(/```json\n([\s\S]+?)\n```/);
		if (match) {
			return JSON.parse(match[1]);
		}

		return {
			totalInputTokens: 0,
			totalOutputTokens: 0,
			totalCost: 0,
			operations: [],
		};
	} catch (error) {
		console.error("Error fetching existing metrics:", error.message);
		return {
			totalInputTokens: 0,
			totalOutputTokens: 0,
			totalCost: 0,
			operations: [],
		};
	}
}

/**
 * Post or update usage comment on issue
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueNumber
 * @param {UsageMetrics} metrics
 */
async function postUsageComment(octokit, owner, repo, issueNumber, metrics) {
	const totalTokens = metrics.totalInputTokens + metrics.totalOutputTokens;

	const comment = `<!-- AI_USAGE_METRICS -->
## 📊 AI Usage Report

### Total Consumption
- **Total Input Tokens**: ${metrics.totalInputTokens.toLocaleString()}
- **Total Output Tokens**: ${metrics.totalOutputTokens.toLocaleString()}
- **Total Tokens**: ${totalTokens.toLocaleString()}
- **Total Cost**: $${metrics.totalCost.toFixed(6)} USD

### Operations Breakdown

| Operation | Model | Input | Output | Cost (USD) |
|-----------|-------|-------|--------|------------|
${metrics.operations
	.map(
		(op) =>
			`| ${op.operation} | \`${op.model}\` | ${op.inputTokens.toLocaleString()} | ${op.outputTokens.toLocaleString()} | $${op.cost.toFixed(6)} |`,
	)
	.join("\n")}

<details>
<summary>Raw Metrics (JSON)</summary>

\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`
</details>

---
*Last updated: ${new Date().toISOString()}*
`;

	try {
		// Find existing comment
		const { data: comments } = await octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: issueNumber,
		});

		const existing = comments.find((c) =>
			c.body.includes("<!-- AI_USAGE_METRICS -->"),
		);

		if (existing) {
			// Update existing comment
			await octokit.rest.issues.updateComment({
				owner,
				repo,
				comment_id: existing.id,
				body: comment,
			});
			console.log(`Updated usage comment #${existing.id}`);
		} else {
			// Create new comment
			const { data } = await octokit.rest.issues.createComment({
				owner,
				repo,
				issue_number: issueNumber,
				body: comment,
			});
			console.log(`Created usage comment #${data.id}`);
		}
	} catch (error) {
		console.error("Error posting usage comment:", error.message);
		throw error;
	}
}

/**
 * Update the 'Cost' field in Project V2 with the total accumulated cost
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueNumber
 * @param {number} totalCost
 */
async function updateProjectCost(octokit, owner, repo, issueNumber, totalCost) {
	try {
		// 1. Get issue node_id
		const { data: issue } = await octokit.rest.issues.get({
			owner,
			repo,
			issue_number: issueNumber,
		});
		const issueNodeId = issue.node_id;

		// 2. Add issue to project (ensures item exists)
		const addResult = await octokit.graphql(
			`
			mutation($projectId: ID!, $contentId: ID!) {
				addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
					item { id }
				}
			}`,
			{ projectId: PROJECT_ID, contentId: issueNodeId },
		);

		const itemId = addResult.addProjectV2ItemById.item.id;

		// 3. Update Cost field (Number field)
		await octokit.graphql(
			`
			mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Float!) {
				updateProjectV2ItemFieldValue(input: {
					projectId: $projectId
					itemId: $itemId
					fieldId: $fieldId
					value: { number: $value }
				}) {
					projectV2Item { id }
				}
			}`,
			{
				projectId: PROJECT_ID,
				itemId,
				fieldId: COST_FIELD_ID,
				value: totalCost,
			},
		);
		console.log(
			`Updated Project Cost field for #${issueNumber}: $${totalCost.toFixed(6)}`,
		);
	} catch (error) {
		console.warn(`Failed to update Project Cost field: ${error.message}`);
		// Non-blocking error
	}
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const params = {};

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace(/^--/, "");
		const value = args[i + 1];

		if (key === "issue" || key === "input-tokens" || key === "output-tokens") {
			params[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] =
				Number.parseInt(value, 10);
		} else {
			params[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
		}
	}

	// Rename 'issue' to 'issueNumber'
	if (params.issue) {
		params.issueNumber = params.issue;
		delete params.issue;
	}

	trackUsage(params)
		.then((metrics) => {
			console.log("✅ Usage tracked successfully");
			console.log(`Total cost: $${metrics.totalCost.toFixed(6)} USD`);
			console.log(
				`Total tokens: ${metrics.totalInputTokens + metrics.totalOutputTokens}`,
			);
		})
		.catch((error) => {
			console.error("❌ Error:", error.message);
			process.exit(1);
		});
}
