import { FIELD_IDS, OPTION_IDS, OWNER, REPO } from "../config/index.js";
import {
	fetchProjectItems,
	getOctokit,
	updateProjectField,
} from "../github/index.js";

export async function orchestrateExecution({ octokit: injectedOctokit } = {}) {
	const octokit = injectedOctokit || getOctokit();
	console.log("Fetching project items...");

	const items = await fetchProjectItems(octokit);

	// 1. Filter candidates (Todo or Paused, not In Progress)
	const candidates = items.filter((item) => {
		return ["Todo", "Paused"].includes(item.status);
	});

	if (candidates.length === 0) {
		console.log("No candidates for execution.");
		return null;
	}

	console.log(`Found ${candidates.length} candidates. Analyzing priorities...`);

	// 2. Sort by: Paused > Todo, then P0 > P1 > P2
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

	// 3. First pass: look for unblocked leaf tasks (no children, not blocked)
	let selectedTask = null;
	let parentWithChildren = null;

	for (const task of sorted) {
		// Skip if blocked
		if (task.labels.includes("blocked")) {
			continue;
		}

		// Skip if parent is blocked
		if (task.parentLabels.includes("blocked")) {
			continue;
		}

		const pendingChildren = task.subIssues.filter((s) => s.state === "OPEN");

		// If this task has pending children, remember it for later
		if (pendingChildren.length > 0 && !parentWithChildren) {
			parentWithChildren = { task, children: pendingChildren };
			continue;
		}

		// Leaf task (no children and not blocked) - select it!
		if (pendingChildren.length === 0) {
			selectedTask = task;
			break;
		}
	}

	// 4. Second pass: if no leaf found, work on children of highest-priority parent
	if (!selectedTask && parentWithChildren) {
		console.log(
			`No unblocked leaf tasks. Prioritizing children of task #${parentWithChildren.task.number} to unblock it.`,
		);

		// Fetch details of all children to prioritize them
		const childDetails = await Promise.all(
			parentWithChildren.children.map(async (child) => {
				try {
					const { data: issue } = await octokit.rest.issues.get({
						owner: OWNER,
						repo: REPO,
						issue_number: child.number,
					});
					return {
						number: issue.number,
						title: issue.title,
						priority: issue.labels?.find((l) => /^P[0-2]$/.test(l)) || "P2",
						blocked: issue.labels?.includes("blocked") || false,
					};
				} catch (err) {
					console.warn(
						`Could not fetch child #${child.number}: ${err.message}`,
					);
					return null;
				}
			}),
		);

		// Sort children: not blocked first, then by priority
		const validChildren = childDetails
			.filter((c) => c && !c.blocked)
			.sort((a, b) => {
				const prioMap = { P0: 0, P1: 1, P2: 2 };
				const pA = prioMap[a.priority] ?? 3;
				const pB = prioMap[b.priority] ?? 3;
				return pA - pB;
			});

		if (validChildren.length > 0) {
			const selectedChild = validChildren[0];
			console.log(
				`Selected sub-issue #${selectedChild.number} to unblock parent #${parentWithChildren.task.number}`,
			);
			selectedTask = {
				id: `sub-${selectedChild.number}`,
				number: selectedChild.number,
				title: selectedChild.title,
				status: "Todo",
				parentNumber: parentWithChildren.task.number,
				isSubIssue: true,
			};
		}
	}

	if (!selectedTask) {
		console.log("No unblocked tasks or sub-issues available.");
		return null;
	}

	console.log(
		`>>> Selected Task: #${selectedTask.number} - ${selectedTask.title}`,
	);

	// 5. Mark as In Progress (only if it's a main task)
	if (!selectedTask.isSubIssue) {
		console.log(`Marking #${selectedTask.number} as In Progress...`);
		try {
			await updateProjectField(
				octokit,
				selectedTask.id,
				FIELD_IDS.status,
				OPTION_IDS.status.inProgress,
			);
		} catch (err) {
			console.warn(`Warning: Could not update status: ${err.message}`);
		}
	} else {
		console.log(
			`Sub-issue #${selectedTask.number} of parent #${selectedTask.parentNumber}`,
		);
	}

	// 6. Dispatch execution
	if (process.env.LOCAL_EXECUTION === "true") {
		return selectedTask;
	}

	console.log(`Dispatching worker for #${selectedTask.number}...`);
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
		console.log("✓ Dispatch successful.");
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
