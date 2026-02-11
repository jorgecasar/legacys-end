#!/usr/bin/env node

/**
 * Gemini Triage with Batch Support and Precision Token Tracking
 *
 * Runs Gemini triage analysis and tracks token usage/costs with precise attribution.
 * Instructions cost is distributed among issues, while task descriptions
 * are charged individually based on their exact token count.
 */

import { Octokit } from "@octokit/rest";
import { trackUsage } from "./ai-usage-tracker.js";
import { countTokens, runWithFallback } from "./gemini-with-fallback.js";

const TRIAGE_PROMPT_BATCH = `Analyze these GitHub issues and decide which AI model should handle each.

{{ISSUES}}

Return ONLY a JSON map where keys are issue numbers (no markdown, no explanation):
{
  "issue_number": {
    "model": "flash|pro|image|none",
    "priority": "P0|P1|P2",
    "labels": ["label1", "label2"]
  }
}

Model selection rules:
- "flash": Simple tasks (fast, cost-effective)
  * Documentation, simple refactoring, small bug fixes
- "pro": Complex tasks (deep reasoning, coding)
  * Architecture, algorithms, multi-file changes
- "image": UI/visual tasks
- "none": Tasks requiring human decision

Priority rules:
- P0: Critical bugs
- P1: Important features
- P2: Improvements/refactoring

Always include "ai-triaged" in labels array.`;

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const OWNER = "jorgecasar";
const REPO = "legacys-end";

async function fetchPendingIssues(octokit) {
	console.log("Searching for pending issues in Project V2 (Todo column)...");

	const result = await octokit.graphql(
		`
		query($projectId: ID!) {
			node(id: $projectId) {
				... on ProjectV2 {
					items(first: 20) {
						nodes {
							id
							content {
								... on Issue {
									number
									title
									body
									labels(first: 10) {
										nodes {
											name
										}
									}
								}
							}
							fieldValueByName(name: "Status") {
								... on ProjectV2ItemFieldSingleSelectValue {
									name
								}
							}
						}
					}
				}
			}
		}
	`,
		{ projectId: PROJECT_ID },
	);

	return result.node.items.nodes
		.filter((item) => {
			const status = item.fieldValueByName?.name;
			const issue = item.content;
			if (!issue || status !== "Todo") return false;

			const hasTriageLabel = issue.labels?.nodes.some(
				(l) => l.name === "ai-triaged",
			);
			return !hasTriageLabel;
		})
		.map((item) => ({
			number: item.content.number,
			title: item.content.title,
			body: item.content.body || "",
		}));
}

async function main() {
	const owner = process.env.GITHUB_REPOSITORY_OWNER || OWNER;
	const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || REPO;
	const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

	if (!token) {
		console.error("Missing GH_TOKEN");
		process.exit(1);
	}

	const octokit = new Octokit({ auth: token });
	const issueNumberArg = process.env.GITHUB_ISSUE_NUMBER;

	let issuesToProcess = [];

	if (issueNumberArg) {
		console.log(`Single mode: Processing issue #${issueNumberArg}`);
		issuesToProcess.push({
			number: Number.parseInt(issueNumberArg, 10),
			title: process.env.GITHUB_ISSUE_TITLE || "",
			body: process.env.GITHUB_ISSUE_BODY || "",
		});

		// If title/body missing, fetch them
		if (!issuesToProcess[0].title) {
			const { data: issue } = await octokit.rest.issues.get({
				owner,
				repo: repoName,
				issue_number: issuesToProcess[0].number,
			});
			issuesToProcess[0].title = issue.title;
			issuesToProcess[0].body = issue.body || "";
		}
	} else {
		console.log("Batch mode: Fetching pending issues...");
		issuesToProcess = await fetchPendingIssues(octokit);
	}

	if (issuesToProcess.length === 0) {
		console.log("No issues to process. Exiting.");
		return;
	}

	// 1. Calculate precise tokens for each issue description and base instructions
	console.log("Calculating precise token counts for attribution...");
	await countTokens(TRIAGE_PROMPT_BATCH.replace("{{ISSUES}}", ""));

	const issueTokenCounts = [];
	for (const issue of issuesToProcess) {
		const text = `Issue #${issue.number}: ${issue.title}\n${issue.body.substring(0, 500)}${issue.body.length > 500 ? "..." : ""}`;
		const tokens = await countTokens(text);
		issueTokenCounts.push({ number: issue.number, tokens });
	}

	// Build prompt for batch
	const issuesText = issuesToProcess
		.map(
			(i) =>
				`Issue #${i.number}: ${i.title}\n${i.body.substring(0, 500)}${i.body.length > 500 ? "..." : ""}`,
		)
		.join("\n\n---\n\n");

	const prompt = TRIAGE_PROMPT_BATCH.replace("{{ISSUES}}", issuesText);

	try {
		console.log(
			`Running Gemini triage for ${issuesToProcess.length} issue(s)...`,
		);
		const result = await runWithFallback("flash", prompt);

		// Parse results
		let triageData;
		try {
			const cleanJson = result.text.replace(/^```json\s*|```$/g, "").trim();
			triageData = JSON.parse(cleanJson);
		} catch {
			console.error("Failed to parse Gemini output:", result.text);
			throw new Error("Invalid JSON from Gemini");
		}

		// 2. Precise Attribution Logic
		// TotalInput = BaseInstructions + Sum(IssueTokens) + Overheads (delimiters, etc.)
		const sumIssueTokens = issueTokenCounts.reduce(
			(sum, item) => sum + item.tokens,
			0,
		);
		// Distributed base cost = (TotalInput - Sum(IssueTokens)) / N
		const distributedBaseTokens = Math.max(
			0,
			Math.ceil((result.inputTokens - sumIssueTokens) / issuesToProcess.length),
		);

		const perIssueOutputTokens = Math.ceil(
			result.outputTokens / issuesToProcess.length,
		);

		console.log("Tracking results and posting comments...");

		for (const issue of issuesToProcess) {
			const data = triageData[issue.number] || triageData[String(issue.number)];
			if (!data) {
				console.warn(`No triage data for issue #${issue.number}`);
				continue;
			}

			const issueSpecificInput =
				issueTokenCounts.find((it) => it.number === issue.number)?.tokens || 0;
			const totalInputForIssue = issueSpecificInput + distributedBaseTokens;

			console.log(
				`- Issue #${issue.number}: ${data.model} | Input: ${totalInputForIssue} (Specific: ${issueSpecificInput}, Shared: ${distributedBaseTokens})`,
			);

			// Track usage with distributed tokens
			await trackUsage({
				owner,
				repo: repoName,
				issueNumber: issue.number,
				model: result.modelUsed,
				inputTokens: totalInputForIssue,
				outputTokens: perIssueOutputTokens,
				operation: "triage",
				octokit,
			});
		}

		// Output for workflow
		if (process.env.GITHUB_OUTPUT) {
			const fs = await import("node:fs");
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`summary<<EOF\n${JSON.stringify(triageData)}\nEOF\n`,
			);
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`batch_mode=${!issueNumberArg}\n`,
			);
		}

		console.log("✅ All triage operations completed.");
	} catch (error) {
		console.error("❌ Batch triage failed:", error.message);
		process.exit(1);
	}
}

main();
