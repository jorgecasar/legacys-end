#!/usr/bin/env node
/**
 * AI Usage Tracker
 *
 * Tracks token usage and costs for AI operations on GitHub issues.
 * Accumulates metrics across multiple executions and posts reports as comments.
 */

import { FIELD_IDS } from "../config/index.js";
import { calculateCost } from "../gemini/pricing.js";

import {
	addIssueToProject,
	getIssueNodeId,
	getOctokit,
	updateProjectField,
} from "../github/index.js";

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
export async function trackUsage(params) {
	const {
		owner,
		repo,
		issueNumber,
		model,
		inputTokens,
		outputTokens,
		operation,
		octokit: providedOctokit,
		skipProjectUpdate = false,
		getOctokit: getOctokitDep = getOctokit,
		calculateCost: calculateCostDep = calculateCost,
		getExistingMetrics: getExistingMetricsDep = getExistingMetrics,
		updateProjectCost: updateProjectCostDep = updateProjectCost,
		postUsageComment: postUsageCommentDep = postUsageComment,
	} = params;

	// Initialize Octokit if not provided
	const octokit = providedOctokit || getOctokitDep();

	// 1. Calculate costs
	const cost = calculateCostDep(model, inputTokens, outputTokens);

	// 2. Get existing metrics from issue
	const existing = await getExistingMetricsDep(
		octokit,
		owner,
		repo,
		issueNumber,
	);

	// 3. Accumulate totals
	const accumulated = {
		totalInputTokens: (existing?.totalInputTokens || 0) + inputTokens,
		totalOutputTokens: (existing?.totalOutputTokens || 0) + outputTokens,
		totalCost: (existing?.totalCost || 0) + cost.totalCost,
		operations: [
			...(existing?.operations || []),
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
	if (!skipProjectUpdate) {
		await updateProjectCostDep(
			octokit,
			owner,
			repo,
			issueNumber,
			accumulated.totalCost,
			{ getIssueNodeId, addIssueToProject, updateProjectField },
		);
	}

	// 5. Post/update usage comment
	await postUsageCommentDep(octokit, owner, repo, issueNumber, accumulated);

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
export async function getExistingMetrics(octokit, owner, repo, issueNumber) {
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
export async function postUsageComment(
	octokit,
	owner,
	repo,
	issueNumber,
	metrics,
) {
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
 */
export async function updateProjectCost(
	octokit,
	owner,
	repo,
	issueNumber,
	totalCost,
	deps = {},
) {
	const {
		getIssueNodeId: getIssueNodeIdDep = getIssueNodeId,
		addIssueToProject: addIssueToProjectDep = addIssueToProject,
		updateProjectField: updateProjectFieldDep = updateProjectField,
	} = deps;

	try {
		const issueNodeId = await getIssueNodeIdDep(octokit, {
			owner,
			repo,
			issueNumber,
		});

		const itemId = await addIssueToProjectDep(octokit, issueNodeId);

		// 3. Update Cost field (Number field)
		await updateProjectFieldDep(
			octokit,
			itemId,
			FIELD_IDS.cost,
			Number(totalCost.toFixed(8)),
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
