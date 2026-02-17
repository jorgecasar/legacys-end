import { execSync as nodeExecSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as configModule from "../config/index.js";
import * as geminiModule from "../gemini/run-cli.js";
import * as githubModule from "../github/index.js";

/**
 * Find leaf issues (open and no open sub-issues) recursively.
 * @param {Array} items - List of issues to check
 * @param {Array} allItems - Global list of all project items for cache resolution
 * @returns {Array} List of leaf issue objects
 */
export function findLeafCandidates(items, allItems) {
	const leaves = [];

	for (const item of items) {
		// Defensive check for item state/status
		if (
			item.status === "Done" ||
			item.state === "CLOSED" ||
			item.status === "CLOSED"
		)
			continue;

		// Resolve full item data from the cache to access its own sub-issues
		const fullItem = allItems.find((i) => i.number === item.number) || item;
		const subIssues = fullItem.subIssues || [];
		const openSubs = subIssues.filter((s) => s.state === "OPEN");

		if (openSubs.length === 0) {
			// It's a leaf!
			leaves.push(fullItem);
		} else {
			// Recurse into open sub-issues
			const subLeaves = findLeafCandidates(openSubs, allItems);
			leaves.push(...subLeaves);
		}
	}

	// Remove duplicates (same issue number)
	const uniqueLeaves = [];
	const seen = new Set();
	for (const leaf of leaves) {
		if (leaf.number && !seen.has(leaf.number)) {
			uniqueLeaves.push(leaf);
			seen.add(leaf.number);
		}
	}

	return uniqueLeaves;
}

/**
 * Orchestration Phase - Hybrid Strategy (Robust Recursive Leaf Discovery)
 * @param {Object} [deps={}] - Injected dependencies
 */
export async function orchestrateExecution(deps = {}) {
	const {
		getOctokit = githubModule.getOctokit,
		fetchProjectItems = githubModule.fetchProjectItems,
		getIssueNodeId = githubModule.getIssueNodeId,
		addIssueToProject = githubModule.addIssueToProject,
		updateProjectField = githubModule.updateProjectField,
		runGeminiCLI = geminiModule.runGeminiCLI,
		execSync = nodeExecSync, // Injectable execSync
		OWNER = configModule.OWNER,
		REPO = configModule.REPO,
		FIELD_IDS = configModule.FIELD_IDS,
		OPTION_IDS = configModule.OPTION_IDS,
	} = deps;

	console.log(">>> Fetching project state and analyzing hierarchy...");

	const octokit = getOctokit();
	const allProjectItems = await fetchProjectItems(octokit);

	// 1. Identify all Todo or Paused items as potential entry points
	const rootCandidates = allProjectItems.filter((item) =>
		["Todo", "Paused"].includes(item.status),
	);

	if (rootCandidates.length === 0) {
		console.log("No Todo or Paused items found in the project.");
		return;
	}

	// 2. Find executable leaf tasks recursively
	const leafCandidates = findLeafCandidates(rootCandidates, allProjectItems);

	if (leafCandidates.length === 0) {
		console.log(
			"No executable leaf tasks found (all work might be blocked or sub-issues missing).",
		);
		return;
	}

	// 3. Prepare summary for Agent
	const candidates = leafCandidates.map((task) => {
		const parent = allProjectItems.find((p) =>
			p.subIssues.some((s) => s.number === task.number),
		);

		// Determine if this task is part of an already started flow
		const isStartedContext =
			task.status === "Paused" || parent?.status === "Paused";

		return {
			number: task.number,
			title: task.title,
			status:
				task.status ||
				(parent?.status === "Paused" ? "Started (via Parent)" : "Todo"),
			priority: task.priority || parent?.priority || "P2",
			parent: parent
				? { number: parent.number, title: parent.title, status: parent.status }
				: null,
			isStartedContext, // Explicit flag for the AI
		};
	});

	const prompt = `
Select the next task. CRITICAL: Finish started work first.

STRATEGY:
1. MANDATORY: Prioritize tasks where 'isStartedContext' is true.
2. Prioritize higher priority (P0 > P1 > P2) within the started tasks.
3. If no started tasks, pick from 'Todo' following priority.

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

OUTPUT ONLY JSON:
{
  "selected_issue_number": number,
  "reason": "short explanation"
}
`;

	console.log(
		`>>> Agent is deciding between ${candidates.length} executable tasks (started work first)...`,
	);

	try {
		const decision = await runGeminiCLI(prompt, {
			modelType: "flash",
			yolo: true,
		});

		const selectedTask = leafCandidates.find(
			(i) => i.number === decision.selected_issue_number,
		);

		if (!selectedTask) {
			console.error(
				`❌ Agent selected #${decision.selected_issue_number}, but it's not a valid leaf candidate.`,
			);
			return;
		}

		console.log(`\n✨ Selected #${selectedTask.number}: ${decision.reason}`);

		// Execute actions
		try {
			// 1. Ensure it's in the project and get its Item ID
			let itemId = selectedTask.id;
			if (!itemId) {
				console.log(
					`>>> Adding #${selectedTask.number} to the project board...`,
				);
				const nodeId = await getIssueNodeId(octokit, {
					owner: OWNER,
					repo: REPO,
					issueNumber: selectedTask.number,
				});
				itemId = await addIssueToProject(octokit, nodeId);
			}

			// 2. Mark as In Progress
			console.log(`>>> Marking #${selectedTask.number} as In Progress...`);
			await updateProjectField(
				octokit,
				itemId,
				FIELD_IDS.status,
				OPTION_IDS.status.inProgress,
			);

			// 3. Dispatch worker
			console.log(`>>> Dispatching AI Worker...`);
			execSync(
				`gh workflow run ai-worker.yml -f issue_number=${selectedTask.number}`,
			);
			console.log("✅ Orchestration complete.");
		} catch (e) {
			console.error(`\n❌ Action Failed: ${e.message}`);
		}
	} catch (error) {
		console.error("❌ Orchestration Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
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
	orchestrateExecution().catch(handleFatalError);
}
