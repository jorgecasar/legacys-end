#!/usr/bin/env node

import { execSync } from "node:child_process";
import process from "node:process";
import { orchestrateExecution } from "./ai-orchestration/orchestrator.js";
import { syncTriageData } from "./ai-orchestration/triage-sync.js";
import { implementPlan } from "./ai-workers/develop.js";
import { createTechnicalPlan } from "./ai-workers/plan.js";
import { triageIssues } from "./gemini/triage.js";

// Load environment variables from .env
if (typeof process.loadEnvFile === "function") {
	process.loadEnvFile(".env");
}

async function main() {
	const args = process.argv.slice(2);
	const flags = {
		issue: null,
		skipAi: false,
		skipTriage: false,
		skipOrchestration: false,
		skipPlanning: false,
		skipDevelop: false,
		skipVerification: false,
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case "--issue":
				flags.issue = args[++i];
				break;
			case "--skip-ai":
				flags.skipAi = true;
				break;
			case "--skip-triage":
				flags.skipTriage = true;
				break;
			case "--skip-orchestration":
				flags.skipOrchestration = true;
				break;
			case "--skip-planning":
				flags.skipPlanning = true;
				break;
			case "--skip-develop":
				flags.skipDevelop = true;
				break;
			case "--skip-verification":
				flags.skipVerification = true;
				break;
		}
	}

	console.log("🚀 Starting AI Agent E2E Flow (Node.js)");
	console.log("--------------------------------");

	let issueNumber = flags.issue || process.env.ISSUE_NUMBER;
	let issueTitle = process.env.ISSUE_TITLE;

	// Propagate issue number to environment for triage module
	if (issueNumber) {
		process.env.GITHUB_ISSUE_NUMBER = issueNumber;
	}

	// 1. TRIAJE
	if (flags.skipTriage || flags.skipAi) {
		console.log("⏭️ Skipping Triage phase.");
	} else {
		console.log(">>> Phase 1: Triage");
		const { triageData } = await triageIssues();
		console.log(
			`Debug - triageData received: ${triageData ? Object.keys(triageData).length : "falsy"}`,
		);

		if (triageData) {
			console.log(">>> Syncing Triage Data to GitHub Project...");
			for (const [issueNum, issueData] of Object.entries(triageData)) {
				const syncData = {
					...issueData,
					issue_number: Number.parseInt(issueNum, 10),
				};
				console.log(
					`>>> Syncing Issue #${issueNum}: ${JSON.stringify(issueData)}`,
				);
				await syncTriageData(JSON.stringify(syncData));
			}
		}
		console.log("✅ Triage completed.");
	}

	// 2. ORQUESTACIÓN
	if (!issueNumber) {
		if (flags.skipOrchestration) {
			console.error(
				"❌ Error: No issue number provided and orchestration skipped.",
			);
			process.exit(1);
		}
		console.log(">>> Phase 2: Orchestration");
		process.env.LOCAL_EXECUTION = "true";
		const selectedTask = await orchestrateExecution();

		if (!selectedTask) {
			console.log("ℹ️ No pending tasks found by orchestrator. Exiting.");
			process.exit(0);
		}
		issueNumber = selectedTask.number;
		issueTitle = selectedTask.title;
		console.log(
			`🎯 Orchestrator selected Issue #${issueNumber}: ${issueTitle}`,
		);
	} else {
		console.log(`🎯 Using specified Issue #${issueNumber}`);
		if (!issueTitle) {
			try {
				const details = JSON.parse(
					execSync(`gh issue view "${issueNumber}" --json title,body`, {
						encoding: "utf8",
					}),
				);
				issueTitle = details.title;
				process.env.ISSUE_BODY = details.body;
			} catch (err) {
				console.warn(
					`Warning: Could not fetch details for issue #${issueNumber}: ${err.message}`,
				);
			}
		}
	}

	// Update environment for subsequent stages
	process.env.ISSUE_NUMBER = issueNumber;
	process.env.ISSUE_TITLE = issueTitle;
	process.env.GITHUB_REPOSITORY_OWNER =
		process.env.GITHUB_REPOSITORY_OWNER || "jorgecasar";
	process.env.GITHUB_REPOSITORY =
		process.env.GITHUB_REPOSITORY || "jorgecasar/legacys-end";

	// 3. PLANIFICACIÓN
	if (flags.skipPlanning || flags.skipAi) {
		console.log("⏭️ Skipping Planning phase.");
	} else {
		console.log(">>> Phase 3: Planning");
		// ai-worker-plan.js uses ISSUE_NUMBER/TITLE/BODY from process.env
		const result = await createTechnicalPlan();
		console.log("✅ Planning completed.");

		// Propagate planning results to Development phase
		if (result?.data) {
			if (result.data.blocked) {
				console.log(
					"⚠️ Planning skipped: issue is blocked by open subtasks. Skipping development and verification.",
				);
				flags.skipDevelop = true;
				flags.skipVerification = true;
			}
			process.env.METHODOLOGY = result.data.methodology || "TDD";
			process.env.FILES = (result.data.files_to_touch || []).join(" ");
			process.env.NEEDS_DECOMPOSITION = result.data.needs_decomposition
				? "true"
				: "false";

			console.log(
				`Debug - Propagating Methodology: ${process.env.METHODOLOGY}`,
			);
			console.log(`Debug - Propagating Files: ${process.env.FILES}`);
			console.log(
				`Debug - Propagating Needs Decomposition: ${process.env.NEEDS_DECOMPOSITION}`,
			);

			if (result.data.needs_decomposition) {
				console.log(
					"⚠️ Task is complex and requires decomposition. Sub-tasks created. Skipping development as requested.",
				);
				flags.skipDevelop = true;
				flags.skipVerification = true;
			}
		}

		// Track usage if available
		if (result?.inputTokens) {
			process.env.PLANNING_INPUT_TOKENS = result.inputTokens;
			process.env.PLANNING_OUTPUT_TOKENS = result.outputTokens;
		}
	}

	// 4. DESARROLLO
	if (flags.skipDevelop || flags.skipAi) {
		console.log("⏭️ Skipping Development phase.");
	} else {
		console.log(">>> Phase 4: Development");
		// ai-worker-develop.js also uses environment variables
		const result = await implementPlan();
		console.log("✅ Development completed.");

		if (result?.inputTokens) {
			process.env.DEVELOPER_INPUT_TOKENS = result.inputTokens;
			process.env.DEVELOPER_OUTPUT_TOKENS = result.outputTokens;
		}
	}

	// 5. VERIFICACIÓN
	if (flags.skipVerification) {
		console.log("⏭️ Skipping Verification phase.");
	} else {
		console.log(">>> Phase 5: Verification");
		try {
			execSync("npm run test:tooling", { stdio: "inherit" });
			console.log("✅ Verification finished.");
		} catch (_error) {
			console.log("⚠️ Warning: Tests failed but continuing flow.");
		}
	}

	// 6. SYNC RESULTS (Costs, status, etc.)
	if (!flags.skipAi) {
		console.log(">>> Phase 6: Syncing Worker Results...");
		const { syncWorkerResults } = await import("./ai-workers/sync.js");
		await syncWorkerResults();
	}

	console.log("--------------------------------");
	console.log(`🏁 Full Flow completed for Issue #${issueNumber}`);
	console.log("Review the changes and create a PR if everything looks good.");
}

main().catch((err) => {
	console.error("❌ Flow Error:", err.message);
	process.exit(1);
});
