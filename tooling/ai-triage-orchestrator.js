#!/usr/bin/env node
import { syncTriageData as syncIssue } from "./ai-triage-sync.js";

async function main() {
	const summary = process.env.GEMINI_SUMMARY;
	const batchMode = process.env.GEMINI_BATCH_MODE === "true";

	if (!summary) {
		console.log("No data to sync.");
		return;
	}

	// Clean JSON (remove potential markdown wrappers)
	const cleanJson = summary.replace(/^```json\s*/g, "").replace(/\s*```$/g, "");

	try {
		const data = JSON.parse(cleanJson);

		if (batchMode) {
			console.log("Batch mode sync detected. Processing all issues in map...");
			for (const [issueNum, issueData] of Object.entries(data)) {
				console.log(`Syncing issue #${issueNum}...`);
				const syncData = {
					...issueData,
					issue_number: Number.parseInt(issueNum, 10),
				};
				await syncIssue(JSON.stringify(syncData));
			}
		} else {
			console.log("Single issue sync detected.");
			await syncIssue(cleanJson);
		}
	} catch (error) {
		console.error("❌ Orchestrator Error:", error.message);
		console.error("Input was:", cleanJson);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
