import { Octokit } from "@octokit/rest";
import { OWNER, REPO } from "../config/index.js";
import { runGeminiCLI } from "../gemini/run-cli.js";
import { fetchProjectItems, getOctokit } from "../github/index.js";
import { syncTriageData } from "../github/triage-adapter.js";

async function runTriage() {
	const specificIssue = process.argv[2] || process.env.ISSUE_NUMBER;
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
		items = items.filter((i) => i.number === parseInt(specificIssue));
		if (items.length === 0) {
			console.error(`❌ Issue #${specificIssue} not found in project board.`);
			return;
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
		});

		const cleanResponse = result.response
			.replace(/```json\s*|```\s*/g, "")
			.trim();
		const decisionMap = JSON.parse(cleanResponse);

		console.log("\n>>> Syncing decisions to GitHub...");
		for (const [number, data] of Object.entries(decisionMap)) {
			if (isNaN(parseInt(number))) continue;

			console.log(
				`Syncing #${number}: Priority=${data.priority}, Category=${data.model}`,
			);
			await syncTriageData(
				JSON.stringify({
					issue_number: parseInt(number),
					...data,
					// 'data.model' is now 'flash' or 'pro' from the AI decision
					usage: {
						model: result.modelUsed,
						inputTokens: result.inputTokens,
						outputTokens: result.outputTokens,
						operation: "triage",
					},
				}),
			);
		}

		console.log(
			`\n✅ Triage Complete for ${isFull ? "all tasks" : "Issue #" + specificIssue}.`,
		);
	} catch (error) {
		console.error("❌ Triage failed:", error.message);
	}
}

runTriage();
