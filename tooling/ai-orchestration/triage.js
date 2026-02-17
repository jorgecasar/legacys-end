import { fileURLToPath } from "node:url";
import { splitTriageCosts } from "../gemini/cost-splitter.js";
import * as geminiModule from "../gemini/run-cli.js";
import * as githubModule from "../github/index.js";
import * as triageAdapterModule from "../github/triage-adapter.js";

/**
 * Triage Agent
 * @param {Object} [deps={}] - Injected dependencies
 */
export async function runTriage(deps = {}) {
	const {
		getOctokit = githubModule.getOctokit,
		fetchProjectItems = githubModule.fetchProjectItems,
		runGeminiCLI = geminiModule.runGeminiCLI,
		syncTriageData = triageAdapterModule.syncTriageData,
		env = process.env,
		argv = process.argv,
	} = deps;

	const specificIssue = argv[2] || env.ISSUE_NUMBER;
	const isFull = !specificIssue;

	if (isFull) {
		console.log(">>> 🔍 Starting Full Triage of all project tasks...");
	} else {
		console.log(`>>> 🔍 Starting Triage for Issue #${specificIssue}...`);
	}

	const octokit = getOctokit();

	// 1. Fetch items
	let items = await fetchProjectItems(octokit);

	if (!isFull) {
		items = items.filter((i) => i.number === parseInt(specificIssue, 10));
		if (items.length === 0) {
			console.error(`❌ Issue #${specificIssue} not found in project board.`);
			return;
		}
	} else {
		// In full mode, skip already triaged items
		const initialCount = items.length;
		items = items.filter((i) => !i.labels.includes("ai-triaged"));
		const skippedCount = initialCount - items.length;
		if (skippedCount > 0) {
			console.log(
				`ℹ️ Skipped ${skippedCount} task(s) already marked as 'ai-triaged'.`,
			);
		}
	}

	const candidates = items.map((i) => ({
		number: i.number,
		title: i.title,
		body: i.body,
		current_labels: i.labels,
		current_priority: i.priority,
		current_status: i.status,
	}));

	if (candidates.length === 0) {
		console.log("No tasks found to triage.");
		return;
	}

	console.log(`>>> Analyzing ${candidates.length} task(s) with AI...`);

	const prompt = `
You are a Technical Project Manager. Analyze the following project task(s) and triage them.

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

STRATEGY:
1. Assign Priority: P0 (Critical/Blocker), P1 (High/Feature), P2 (Low/Nice to have).
2. Assign Type: 'epic' (if it has sub-tasks or is too broad), 'task', or 'bug'.
3. Assign Model Category: 
   - 'pro': For architectural changes, complex logic, or tasks affecting multiple files.
   - 'flash': For simple documentation, small fixes, or isolated components.
4. Verify if 'ai-triaged' label is appropriate.

OUTPUT ONLY JSON (a map where keys are issue numbers as strings):
{
  "${candidates[0].number}": { 
    "priority": "P0", 
    "labels": ["task", "ai-triaged"], 
    "model": "pro",
    "reason": "short reason" 
  }
}
`;

	try {
		const result = await runGeminiCLI(prompt, {
			modelType: "flash",
			yolo: true,
			inputTokenBudget: parseInt(env.TRIAGE_TOKEN_BUDGET || "20000", 10),
		});

		const cleanResponse = result.response
			.replace(/```json\s*|```\s*/g, "")
			.trim();
		const decisionMap = JSON.parse(cleanResponse);

		// Distribute costs
		const costResults = splitTriageCosts(
			candidates,
			result.inputTokens,
			result.outputTokens,
		);

		console.log("\n>>> Syncing decisions to GitHub...");
		for (const costItem of costResults) {
			const number = costItem.number;
			const data = decisionMap[number];

			if (!data || Number.isNaN(number)) continue;

			console.log(
				`Syncing #${number}: Priority=${data.priority}, Category=${data.model}`,
			);
			await syncTriageData(
				JSON.stringify({
					issue_number: number,
					...data,
					usage: {
						model: result.modelUsed,
						inputTokens: costItem.inputTokens,
						outputTokens: costItem.outputTokens,
						operation: "triage",
					},
				}),
			);
		}

		console.log(
			`\n✅ Triage Complete for ${isFull ? "all tasks" : `Issue #${specificIssue}`}.`,
		);
	} catch (error) {
		console.error("❌ Triage failed:", error.message);
	}
}

/**
 * Named handler to achieve 100% function coverage
 * @param {Error} err - Error object
 */
export function handleFatalError(err) {
	console.error(err);
	process.exit(1);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	runTriage().catch(handleFatalError);
}
