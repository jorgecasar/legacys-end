#!/usr/bin/env node
import { OWNER, REPO } from "../config/index.js";
import { runWithFallback } from "../gemini/index.js";
import {
	fetchProjectItems,
	getIssue,
	getOctokit,
	getSubIssues,
} from "../github/index.js";

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
- pro: Complex features, architectural changes, multiple files, or subtle logic bugs. If an issue has sub-issues, the parent should be handled by 'pro' to coordinate, while children might be 'flash'.
- image: ONLY if the issue body contains UI/UX screenshots or requires visual analysis.
- none: Questions, spam, or issues not requiring code changes.

Output Requirements:
- Return a JSON map where keys are issue numbers.
- Each value MUST contain 'model', 'priority', and 'labels'.
- Include "ai-triaged" in the labels array for every issue processed.
- If an issue seems to be a parent task (has high complexity or explicit sub-tasks mentions), assign it 'pro' model and P1/P0 priority.`;

const TRIAGE_PROMPT_BATCH = `Issues to triage:

{{ISSUES}}`;

const MAX_CHARS_PER_BATCH = 5000; // Limit batch size to ~5k characters to keep responses manageable

/**
 * Divide issues into batches based on character limit
 */
function createIssueBatches(issues, maxCharsPerBatch = MAX_CHARS_PER_BATCH) {
	const batches = [];
	let currentBatch = [];
	let currentSize = 0;

	for (const issue of issues) {
		const subIssuesText =
			issue.subIssues && issue.subIssues.length > 0
				? `\nSub-issues count: ${issue.subIssues.length}`
				: "";
		const issueText = `Issue #${issue.number}: ${issue.title}\n${issue.body.substring(0, 500)}${subIssuesText}\n\n---\n\n`;
		const issueSize = issueText.length;

		// If adding this issue exceeds limit and we have items, start new batch
		if (currentSize + issueSize > maxCharsPerBatch && currentBatch.length > 0) {
			batches.push(currentBatch);
			currentBatch = [issue];
			currentSize = issueSize;
		} else {
			currentBatch.push(issue);
			currentSize += issueSize;
		}
	}

	if (currentBatch.length > 0) {
		batches.push(currentBatch);
	}

	return batches;
}

async function getSubIssuesToProcess(octokit, items) {
	const promises = items.map(async (item) => {
		const itemsToProcess = [];
		if (item.state === "OPEN") {
			try {
				const subIssueDetails = await getIssue(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber: item.number,
				});

				console.log(
					`Debug - Checking sub-issue #${subIssueDetails.number} for ai-triaged label: ${subIssueDetails.labels
						.map((l) => l.name)
						.join(", ")}`,
				);
				if (
					!subIssueDetails.labels.some((label) => label.name === "ai-triaged")
				) {
					itemsToProcess.unshift({
						number: subIssueDetails.number,
						title: subIssueDetails.title,
						body: subIssueDetails.body || "",
					});
				}

				// Get sub-issues of the current sub-issue
				const nestedSubIssues = await getSubIssues(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber: item.number,
				});

				if (nestedSubIssues.length > 0) {
					const recursiveResults = await getSubIssuesToProcess(
						octokit,
						nestedSubIssues,
					);
					itemsToProcess.push(...recursiveResults);
				}
			} catch (err) {
				console.warn(
					`Warning: Failed to process sub-issue #${item.number}: ${err.message}`,
				);
			}
		}
		return itemsToProcess;
	});

	const results = await Promise.all(promises);
	return results.flat();
}

async function fetchPendingIssues(octokit) {
	const items = await fetchProjectItems(octokit);
	const issuesToProcess = [];

	for (const item of items) {
		// Add parent issues in Todo status without ai-triaged label
		if (item.status === "Todo" && !item.labels.includes("ai-triaged")) {
			issuesToProcess.push({
				number: item.number,
				title: item.title,
				body: item.body || "",
				subIssues: item.subIssues || [],
			});
		}
		if (item.subIssues?.length > 0) {
			const subIssues = await getSubIssuesToProcess(octokit, item.subIssues);
			issuesToProcess.push(...subIssues);
		}
	}

	return issuesToProcess;
}

export async function triageIssues() {
	let octokit;
	try {
		octokit = getOctokit();
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}

	const issueNumberArg = process.env.GITHUB_ISSUE_NUMBER;
	let issuesToProcess = [];

	if (issueNumberArg) {
		const issueNumber = Number.parseInt(issueNumberArg, 10);
		const issue = await getIssue(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber,
		});

		// Fetch sub-issues for the specific issue
		const subIssues = await getSubIssues(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber,
		});

		issuesToProcess.push({
			number: issue.number,
			title: issue.title,
			body: issue.body || "",
			subIssues: subIssues || [],
		});

		if (subIssues.length > 0) {
			const recursiveSubIssues = await getSubIssuesToProcess(
				octokit,
				subIssues,
			);
			issuesToProcess.push(...recursiveSubIssues);
		}
	} else {
		issuesToProcess = await fetchPendingIssues(octokit);
	}

	if (issuesToProcess.length === 0) {
		console.log("No issues to process.");
		return { triageData: {}, batchMode: !process.env.GITHUB_ISSUE_NUMBER };
	}

	// Divide issues into batches based on character limit
	const batches = createIssueBatches(issuesToProcess);
	console.log(
		`>>> Divided ${issuesToProcess.length} issue(s) into ${batches.length} batch(es)`,
	);

	const triageData = {};
	let totalInputTokens = 0;
	let totalOutputTokens = 0;

	try {
		// Process all batches in parallel
		const batchResults = await Promise.all(
			batches.map(async (batch, batchIndex) => {
				const issuesText = batch
					.map(
						(i) =>
							`Issue #${i.number}: ${i.title}\n${i.body.substring(0, 500)}`,
					)
					.join("\n\n---\n\n");

				const prompt = TRIAGE_PROMPT_BATCH.replace("{{ISSUES}}", issuesText);

				console.log(
					`>>> Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} issue(s))...`,
				);

				try {
					const result = await runWithFallback("flash", prompt, {
						systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
						responseSchema: TRIAGE_SCHEMA,
						maxRetries: 1,
					});

					const triageResults = result.data.results || [];
					const batchData = {};
					for (const res of triageResults) {
						batchData[res.issue_number] = {
							model: res.model,
							priority: res.priority,
							labels: res.labels,
						};
					}

					console.log(
						`✅ Batch ${batchIndex + 1} processed: ${Object.keys(batchData).length} issues`,
					);

					return {
						batchData,
						inputTokens: result.inputTokens,
						outputTokens: result.outputTokens,
						modelUsed: result.modelUsed,
					};
				} catch (batchErr) {
					console.error(`❌ Batch ${batchIndex + 1} failed:`, batchErr.message);
					throw batchErr;
				}
			}),
		);

		// Merge results from all batches
		for (const batchResult of batchResults) {
			Object.assign(triageData, batchResult.batchData);
			totalInputTokens += batchResult.inputTokens || 0;
			totalOutputTokens += batchResult.outputTokens || 0;
		}

		console.log(
			`Debug - triageData processed: ${Object.keys(triageData).length} issues total`,
		);
		console.log(
			`Debug - Total tokens: ${totalInputTokens} in / ${totalOutputTokens} out`,
		);

		const distributedBaseTokens =
			totalInputTokens > 0
				? Math.ceil(totalInputTokens / issuesToProcess.length)
				: 0;
		const perIssueOutputTokens =
			totalOutputTokens > 0
				? Math.ceil(totalOutputTokens / issuesToProcess.length)
				: 0;

		// Get model used from first batch (typically same across all batches)
		const modelUsed = batchResults[0]?.modelUsed || "gemini-2.5-flash-lite";

		for (const issue of issuesToProcess) {
			const data = triageData[issue.number] || triageData[String(issue.number)];
			if (!data) continue;

			data.usage = {
				model: modelUsed,
				inputTokens: distributedBaseTokens,
				outputTokens: perIssueOutputTokens,
				operation: "triage",
			};
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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	triageIssues().catch((err) => {
		console.error("❌ Sync Error:", err.message);
		process.exit(1);
	});
}
