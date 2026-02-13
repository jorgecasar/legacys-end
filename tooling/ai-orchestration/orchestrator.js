import { FIELD_IDS, OPTION_IDS, OWNER, REPO } from "../config/index.js";
import {
	fetchProjectItems,
	getIssue,
	getOctokit,
	getSubIssues,
	updateProjectField,
} from "../github/index.js";

/**
 * Recursively find an executable leaf task (no open children) starting from a given issue.
 * @param {Object} octokit
 * @param {number} issueNumber
 * @param {Array} allProjectItems - Cache of items from the project
 * @param {Set} visited - To prevent cycles
 * @returns {Promise<Object|null>} The leaf task object or null if none found/all blocked
 */
async function findExecutableLeaf(
	octokit,
	issueNumber,
	allProjectItems,
	visited = new Set(),
) {
	if (visited.has(issueNumber)) return null;
	visited.add(issueNumber);

	// 1. Resolve full task details (prefer cache from project)
	let task = allProjectItems.find((i) => i.number === issueNumber);
	let subIssues = [];
	let labels = [];
	let body = "";

	if (task) {
		// We have project data
		subIssues = task.subIssues || []; // { number, state }
		labels = task.labels || [];
		body = task.body || ""; // Assume body is pre-fetched for project items
	} else {
		// Fetch from API if not in project snapshot
		try {
			console.log(
				`    Fetching details for non-project item #${issueNumber}...`,
			);
			const issue = await getIssue(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber,
			});
			const subs = await getSubIssues(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber,
			});
			task = {
				number: issue.number,
				title: issue.title,
				status: "Todo", // Default since it's not in project
				priority: "P2", // Default
				id: null, // Unknown project item ID
			};
			labels = issue.labels.map((l) => l.name);
			body = issue.body || "";
			subIssues = subs;
		} catch (e) {
			console.warn(`    Failed to fetch #${issueNumber}: ${e.message}`);
			return null;
		}
	}

	// 2. Check explicit "Blocked by" directives in the body
	const blockMatches = body.match(/Blocked by #(\d+)/g) || [];
	if (blockMatches.length > 0) {
		const blockingIssueNumbers = blockMatches.map((b) =>
			parseInt(b.replace("Blocked by #", "")),
		);
		console.log(
			`    → #${issueNumber} is blocked by ${blockingIssueNumbers.join(", ")}. Checking their status...`,
		);

		for (const blockerNumber of blockingIssueNumbers) {
			const blocker = await getIssue(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber: blockerNumber,
			});
			if (blocker.state === "open") {
				console.log(
					`    ✗ Blocker #${blockerNumber} is still open. Cannot proceed.`,
				);

				return null; // Hard block
			}
			console.log(`    ✓ Blocker #${blockerNumber} is closed.`);
		}
	}

	// 3. Check labels
	if (labels.includes("blocked")) {
		console.log(`    ✗ #${issueNumber} has a 'blocked' label.`);
		return null;
	}

	// 4. Check children
	const openChildren = subIssues.filter((s) => s.state === "OPEN");

	if (openChildren.length === 0) {
		// It's a leaf!
		return task;
	}

	console.log(
		`    → #${issueNumber} has ${openChildren.length} open children. Drilling down...`,
	);

	// 4. Recurse into children
	// Sort children to prioritize best paths: Paused > Todo, P0 > P1 > P2
	// We need to look up their metadata from allProjectItems to sort effectively
	const childCandidates = openChildren.map((child) => {
		const cached = allProjectItems.find((i) => i.number === child.number);
		return {
			number: child.number,
			status: cached ? cached.status : "Todo",
			priority: cached ? cached.priority : "P2",
		};
	});

	const sortedChildren = childCandidates.sort((a, b) => {
		const statusOrder = { Paused: 0, Todo: 1 };
		const statusA = statusOrder[a.status] ?? 2;
		const statusB = statusOrder[b.status] ?? 2;
		if (statusA !== statusB) return statusA - statusB;

		const prioMap = { P0: 0, P1: 1, P2: 2 };
		const pA = prioMap[a.priority] ?? 3;
		const pB = prioMap[b.priority] ?? 3;
		return pA - pB;
	});

	for (const child of sortedChildren) {
		const leaf = await findExecutableLeaf(
			octokit,
			child.number,
			allProjectItems,
			visited,
		);
		if (leaf) {
			return leaf;
		}
	}

	console.log(`    ✗ All children of #${issueNumber} are blocked or finished.`);
	return null;
}

export async function orchestrateExecution({ octokit: injectedOctokit } = {}) {
	const octokit = injectedOctokit || getOctokit();
	console.log("Fetching project items...");

	const items = await fetchProjectItems(octokit);

	// 1. Filter candidates (Todo or Paused)
	const candidates = items.filter((item) => {
		return ["Todo", "Paused"].includes(item.status);
	});

	if (candidates.length === 0) {
		console.log("No candidates for execution.");
		return null;
	}

	console.log(`Found ${candidates.length} candidates.`);

	// 2. Sort candidates: Paused > Todo, then P0 > P1 > P2
	const sorted = candidates.sort((a, b) => {
		const statusOrder = { Paused: 0, Todo: 1 };
		const statusA = statusOrder[a.status];
		const statusB = statusOrder[b.status];
		if (statusA !== statusB) return statusA - statusB;

		const prioMap = { P0: 0, P1: 1, P2: 2 };
		const pA = prioMap[a.priority] ?? 3;
		const pB = prioMap[b.priority] ?? 3;
		return pA - pB;
	});

	let selectedTask = null;

	// 3. Search for the first executable leaf
	for (const candidate of sorted) {
		console.log(
			`\n🔍 Examining candidate #${candidate.number} [${candidate.status}/${candidate.priority}] "${candidate.title}"...`,
		);

		const leaf = await findExecutableLeaf(octokit, candidate.number, items);

		if (leaf) {
			console.log(
				`  ✅ Found executable leaf: #${leaf.number} "${leaf.title}"`,
			);
			selectedTask = leaf;

			// Add metadata if it's a sub-issue
			if (leaf.number !== candidate.number) {
				selectedTask.isSubIssue = true;
				selectedTask.parentNumber = candidate.number;
				// If we fetched it from API, it might not have 'id', which is fine for dispatch
				// but we can't update its Project Status if we don't have the ID.
				// However, if it wasn't in the project items list, we can't update project fields anyway.
			} else {
				selectedTask.isSubIssue = false;
			}
			break;
		} else {
			console.log(`  ✗ No executable leaf found (blocked loop or children).`);
		}
	}

	if (!selectedTask) {
		console.log("\n❌ No unblocked tasks or sub-issues available.");
		return null;
	}

	console.log(
		`\n✨ >>> SELECTED TASK: #${selectedTask.number} - ${selectedTask.title}`,
	);

	// 4. Mark as In Progress (only if we have a Project Item ID)
	if (selectedTask.id) {
		console.log(`\n📍 Marking #${selectedTask.number} as "In Progress"...`);
		try {
			await updateProjectField(
				octokit,
				selectedTask.id,
				FIELD_IDS.status,
				OPTION_IDS.status.inProgress,
			);
			console.log(`✅ Status updated.`);
		} catch (err) {
			console.warn(`⚠️  Could not update status: ${err.message}`);
		}
	} else {
		console.log(
			`\nℹ️  Task #${selectedTask.number} is not linked to the project (or ID unknown), skipping status update.`,
		);
	}

	// 5. Dispatch execution
	if (process.env.LOCAL_EXECUTION === "true") {
		console.log("\n🎯 Local execution enabled. Returning task...");
		return selectedTask;
	}

	console.log(`\n🚀 Dispatching worker for #${selectedTask.number}...`);
	try {
		await octokit.rest.actions.createWorkflowDispatch({
			owner: OWNER,
			repo: REPO,
			workflow_id: "ai-worker.yml",
			ref: "main",
			inputs: {
				issue_number: String(selectedTask.number),
			},
		});
		console.log("✅ Dispatch successful.");
	} catch (err) {
		console.error(`❌ Dispatch failed: ${err.message}`);
		throw err;
	}
	return selectedTask;
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	orchestrateExecution().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
