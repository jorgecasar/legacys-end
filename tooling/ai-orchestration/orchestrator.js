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
	candidates.forEach((c) => {
		console.log(`  · #${c.number} [${c.status}/${c.priority}] "${c.title}"`);
	});

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

	console.log("\nSorted by (Paused > Todo) and (P0 > P1 > P2):");
	sorted.forEach((c) => {
		const childCount = c.subIssues.filter((s) => s.state === "OPEN").length;
		console.log(
			`  · #${c.number} [${c.status}/${c.priority}] ${childCount} open children - "${c.title}"`,
		);
	});

	let selectedTask = null;

	// Focus only on Paused tasks until they're unblocked
	const pausedTasks = sorted.filter((t) => t.status === "Paused");

	if (pausedTasks.length === 0) {
		// Only if no Paused tasks, work on Todo tasks
		console.log("\n📋 No Paused tasks. Working on Todo tasks...");
		const todoTasks = sorted.filter((t) => t.status === "Todo");

		// Look for Todo leaf tasks
		for (const task of todoTasks) {
			if (task.labels.includes("blocked")) {
				console.log(
					`  ✗ #${task.number} [Todo] → discarded (has 'blocked' label)`,
				);
				continue;
			}

			if (task.parentLabels.includes("blocked")) {
				console.log(
					`  ✗ #${task.number} [Todo] → discarded (its parent has 'blocked' label)`,
				);
				continue;
			}

			const pendingChildren = task.subIssues.filter((s) => s.state === "OPEN");

			if (pendingChildren.length === 0) {
				console.log(
					`  ✅ #${task.number} [Todo] → SELECTED (leaf task with no open children)`,
				);
				selectedTask = task;
				break;
			} else {
				console.log(
					`  ✗ #${task.number} [Todo] → discarded (has ${pendingChildren.length} open child(ren))`,
				);
			}
		}
	} else {
		// Work with Paused tasks
		console.log(
			`\n📋 Found ${pausedTasks.length} Paused tasks. Searching for leaf tasks or their children...`,
		);

		// 1. Look for Paused leaf tasks (no children)
		console.log("  Looking for Paused leaf tasks...");
		for (const task of pausedTasks) {
			if (task.labels.includes("blocked")) {
				console.log(
					`  ✗ #${task.number} [P${task.priority}] → discarded (has 'blocked' label)`,
				);
				continue;
			}

			if (task.parentLabels.includes("blocked")) {
				console.log(
					`  ✗ #${task.number} [P${task.priority}] → discarded (its parent has 'blocked' label)`,
				);
				continue;
			}

			const pendingChildren = task.subIssues.filter((s) => s.state === "OPEN");

			if (pendingChildren.length === 0) {
				console.log(
					`  ✅ #${task.number} [${task.priority}] → FOUND (leaf task with no children)`,
				);
				selectedTask = task;
				break;
			}
		}

		// 2. If no leaf found, pick the most important Paused task and work on its children
		if (!selectedTask) {
			console.log(
				"\n  No Paused leaf tasks found. Selecting most important Paused parent...",
			);
			// Already sorted by priority (Paused first, then P0 > P1 > P2), so first one with children is the most important
			const mostImportantParent = pausedTasks.find(
				(t) =>
					!t.labels.includes("blocked") &&
					!t.parentLabels.includes("blocked") &&
					t.subIssues.filter((s) => s.state === "OPEN").length > 0,
			);

			if (mostImportantParent) {
				console.log(
					`  ✅ #${mostImportantParent.number} [${mostImportantParent.priority}] → SELECTED as priority parent`,
				);
				const pendingChildren = mostImportantParent.subIssues.filter(
					(s) => s.state === "OPEN",
				);
				console.log(
					`\n  🔍 Analyzing ${pendingChildren.length} children to unblock parent...`,
				);

				// Fetch details of all children to prioritize them
				const childDetails = await Promise.all(
					pendingChildren.map(async (child) => {
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

				// Log all children with their status
				childDetails.forEach((child) => {
					if (!child) return;
					const blockedStatus = child.blocked ? "(blocked)" : "(available)";
					console.log(
						`    · #${child.number} [${child.priority}] ${blockedStatus} - "${child.title}"`,
					);
				});

				// Sort children: not blocked first, then by priority (P0 > P1 > P2)
				const validChildren = childDetails
					.filter((c) => c && !c.blocked)
					.sort((a, b) => {
						const prioMap = { P0: 0, P1: 1, P2: 2 };
						const pA = prioMap[a.priority] ?? 3;
						const pB = prioMap[b.priority] ?? 3;
						return pA - pB;
					});

				const blockedChildren = childDetails.filter((c) => c && c.blocked);
				if (blockedChildren.length > 0) {
					console.log(
						`\n  ⚠️  ${blockedChildren.length} blocked child(ren), skipped:`,
					);
					blockedChildren.forEach((child) => {
						console.log(`      · #${child.number}`);
					});
				}

				if (validChildren.length > 0) {
					const selectedChild = validChildren[0];
					console.log(
						`\n  ✅ Sub-task selected: #${selectedChild.number} [${selectedChild.priority}] to unblock parent #${mostImportantParent.number}`,
					);
					selectedTask = {
						id: `sub-${selectedChild.number}`,
						number: selectedChild.number,
						title: selectedChild.title,
						status: "Todo",
						parentNumber: mostImportantParent.number,
						isSubIssue: true,
					};
				} else {
					console.log(
						`  ⚠️  All children of #${mostImportantParent.number} are blocked, no task available.`,
					);
				}
			}
		}

		// If still no task selected, now try Todo parents
		if (!selectedTask) {
			console.log("\n📋 SECOND PASS (continued): Trying TODO parents...");
			const todoParents = sorted.filter((t) => t.status === "Todo");

			for (const task of todoParents) {
				// Skip if blocked
				if (task.labels.includes("blocked")) {
					console.log(
						`  ✗ #${task.number} [Todo] → discarded (has 'blocked' label)`,
					);
					continue;
				}

				// Skip if parent is blocked
				if (task.parentLabels.includes("blocked")) {
					console.log(
						`  ✗ #${task.number} [Todo] → discarded (its parent has 'blocked' label)`,
					);
					continue;
				}

				const pendingChildren = task.subIssues.filter(
					(s) => s.state === "OPEN",
				);

				// Found a Todo task with pending children - work on one of them
				if (pendingChildren.length > 0) {
					console.log(
						`  ✅ #${task.number} [Todo] → PARENT SELECTED (${pendingChildren.length} open child(ren))`,
					);
					console.log(
						`\n🔍 Analyzing children of #${task.number} to unblock it...`,
					);

					// Fetch details of all children to prioritize them
					const childDetails = await Promise.all(
						pendingChildren.map(async (child) => {
							try {
								const { data: issue } = await octokit.rest.issues.get({
									owner: OWNER,
									repo: REPO,
									issue_number: child.number,
								});
								return {
									number: issue.number,
									title: issue.title,
									priority:
										issue.labels?.find((l) => /^P[0-2]$/.test(l)) || "P2",
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

					// Log all children with their status
					childDetails.forEach((child) => {
						if (!child) return;
						const blockedStatus = child.blocked ? "(blocked)" : "(available)";
						console.log(
							`    · #${child.number} [${child.priority}] ${blockedStatus} - "${child.title}"`,
						);
					});

					// Sort children: not blocked first, then by priority
					const validChildren = childDetails
						.filter((c) => c && !c.blocked)
						.sort((a, b) => {
							const prioMap = { P0: 0, P1: 1, P2: 2 };
							const pA = prioMap[a.priority] ?? 3;
							const pB = prioMap[b.priority] ?? 3;
							return pA - pB;
						});

					const blockedChildren = childDetails.filter((c) => c && c.blocked);
					if (blockedChildren.length > 0) {
						console.log(
							`\n  ⚠️  ${blockedChildren.length} blocked child(ren), skipped:`,
						);
						blockedChildren.forEach((child) => {
							console.log(`      · #${child.number}`);
						});
					}

					if (validChildren.length > 0) {
						const selectedChild = validChildren[0];
						console.log(
							`\n  ✅ Sub-task selected: #${selectedChild.number} [${selectedChild.priority}] to unblock parent #${task.number}`,
						);
						selectedTask = {
							id: `sub-${selectedChild.number}`,
							number: selectedChild.number,
							title: selectedChild.title,
							status: "Todo",
							parentNumber: task.number,
							isSubIssue: true,
						};
						break;
					} else {
						console.log(
							`  ⚠️  All children of #${task.number} are blocked, skipping...`,
						);
					}
				} else {
					console.log(
						`  ✗ #${task.number} [Todo] → discarded (has no open children)`,
					);
				}
			}
		}
	}

	if (!selectedTask) {
		console.log("\n❌ No unblocked tasks or sub-issues available.");
		return null;
	}

	console.log(
		`\n✨ >>> SELECTED TASK: #${selectedTask.number} - ${selectedTask.title}`,
	);

	// 5. Mark as In Progress (only if it's a main task)
	if (!selectedTask.isSubIssue) {
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
			`\n📍 Sub-task #${selectedTask.number} of parent #${selectedTask.parentNumber}`,
		);
	}

	// 6. Dispatch execution
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
