#!/usr/bin/env node
import { Octokit } from "@octokit/rest";
import { trackUsage } from "./ai-usage-tracker.js";
import { runWithFallback } from "./gemini-with-fallback.js";

const TRIAGE_SCHEMA = {
	type: "OBJECT",
	additionalProperties: {
		type: "OBJECT",
		properties: {
			model: { type: "STRING", enum: ["flash", "pro", "image", "none"] },
			priority: { type: "STRING", enum: ["P0", "P1", "P2"] },
			labels: { type: "ARRAY", items: { type: "STRING" } },
		},
		required: ["model", "priority", "labels"],
	},
};

const TRIAGE_PROMPT_BATCH = `Analyze these GitHub issues and decide which AI model should handle each.

{{ISSUES}}

Instruction: Return a JSON map where keys are issue numbers.
Include "ai-triaged" in labels array.`;

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const OWNER = "jorgecasar";
const REPO = "legacys-end";

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

async function main() {
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
			responseSchema: TRIAGE_SCHEMA,
		});

		const triageData = result.data;
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
	} catch (error) {
		console.error("❌ Triage Error:", error.message);
		process.exit(1);
	}
}

main();
