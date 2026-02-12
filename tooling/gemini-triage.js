#!/usr/bin/env node
import { Octokit } from "@octokit/rest";
import { trackUsage } from "./ai-usage-tracker.js";
import { runWithFallback } from "./gemini-with-fallback.js";

const TRIAGE_SCHEMA = {
	type: "OBJECT",
	properties: {
		results: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					issue_number: {
						type: "INTEGER",
						description: "The GitHub issue number being triaged.",
					},
					model: {
						type: "STRING",
						enum: ["flash", "pro", "image", "none"],
						description: "The AI model that should handle this task.",
					},
					priority: {
						type: "STRING",
						enum: ["P0", "P1", "P2"],
						description: "Urgency: P0 (Critical), P1 (High), P2 (Normal).",
					},
					labels: {
						type: "ARRAY",
						items: { type: "STRING" },
						description:
							"Labels to apply. MUST include 'ai-triaged' for successful identification.",
					},
				},
				required: ["issue_number", "model", "priority", "labels"],
			},
		},
	},
	required: ["results"],
};

const TRIAGE_SYSTEM_INSTRUCTION = `You are a Triage Agent. Analyze the provided GitHub issues and decide the best execution strategy.

Model Selection Guidelines:
- flash: Simple tasks, bug fixes in single files, documentation, or small refactors.
- pro: Complex features, architectural changes, multiple files, or subtle logic bugs.
- image: ONLY if the issue body contains UI/UX screenshots or requires visual analysis.
- none: Questions, spam, or issues not requiring code changes.

Output Requirements:
- Return a JSON map where keys are issue numbers.
- Each value MUST contain 'model', 'priority', and 'labels'.
- Include "ai-triaged" in the labels array for every issue processed.`;

const TRIAGE_PROMPT_BATCH = `Issues to triage:

{{ISSUES}}`;

import { OWNER, REPO } from "./ai-config.js";

async function fetchPendingIssues(octokit) {
	const result = await octokit.graphql(
		`query($projectId: ID!) {
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
									labels(first: 10) { nodes { name } }
								}
							}
							fieldValueByName(name: "Status") {
								... on ProjectV2ItemFieldSingleSelectValue { name }
							}
						}
					}
				}
			}
		}`,
		{ projectId: PROJECT_ID },
	);

	return result.node.items.nodes
		.filter((item) => {
			const status = item.fieldValueByName?.name;
			const issue = item.content;
			if (!issue || status !== "Todo") return false;
			return !issue.labels?.nodes.some((l) => l.name === "ai-triaged");
		})
		.map((item) => ({
			number: item.content.number,
			title: item.content.title,
			body: item.content.body || "",
		}));
}

export async function triageIssues() {
	const token = process.env.GH_TOKEN;
	if (!token) {
		console.error("Missing GH_TOKEN");
		process.exit(1);
	}

	const octokit = new Octokit({ auth: token });
	const issueNumberArg = process.env.GITHUB_ISSUE_NUMBER;
	let issuesToProcess = [];

	if (issueNumberArg) {
		const { data: issue } = await octokit.rest.issues.get({
			owner: OWNER,
			repo: REPO,
			issue_number: Number.parseInt(issueNumberArg, 10),
		});
		issuesToProcess.push({
			number: issue.number,
			title: issue.title,
			body: issue.body || "",
		});
	} else {
		issuesToProcess = await fetchPendingIssues(octokit);
	}

	if (issuesToProcess.length === 0) {
		console.log("No issues to process.");
		return;
	}

	const issuesText = issuesToProcess
		.map((i) => `Issue #${i.number}: ${i.title}\n${i.body.substring(0, 500)}`)
		.join("\n\n---\n\n");

	const prompt = TRIAGE_PROMPT_BATCH.replace("{{ISSUES}}", issuesText);

	try {
		console.log(
			`>>> Running structured triage for ${issuesToProcess.length} issue(s)...`,
		);
		const result = await runWithFallback("flash", prompt, {
			systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
			responseSchema: TRIAGE_SCHEMA,
		});

		const triageResults = result.data.results || [];
		const triageData = {};
		for (const res of triageResults) {
			triageData[res.issue_number] = {
				model: res.model,
				priority: res.priority,
				labels: res.labels,
			};
		}

		console.log(
			`Debug - triageData processed: ${Object.keys(triageData).length} issues`,
		);

		const distributedBaseTokens = Math.ceil(
			result.inputTokens / issuesToProcess.length,
		);
		const perIssueOutputTokens = Math.ceil(
			result.outputTokens / issuesToProcess.length,
		);

		for (const issue of issuesToProcess) {
			const data = triageData[issue.number] || triageData[String(issue.number)];
			if (!data) continue;

			await trackUsage({
				owner: OWNER,
				repo: REPO,
				issueNumber: issue.number,
				model: result.modelUsed,
				inputTokens: distributedBaseTokens,
				outputTokens: perIssueOutputTokens,
				operation: "triage",
				octokit,
			});
		}

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
		// Return triage data for orchestration
		return { triageData, batchMode: !issueNumberArg };
	} catch (error) {
		console.error("❌ Triage Error:", error.message);
		process.exit(1);
	}
}

import { fileURLToPath } from "node:url";

if (import.meta.url === fileURLToPath(import.meta.url)) {
	triageIssues();
}
