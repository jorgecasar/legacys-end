import { execSync } from "node:child_process";

const PROJECT_NUMBER = 2;
const OWNER = "jorgecasar";

export async function main({ exec = execSync } = {}) {
	console.log("Fetching project items...");

	const listResult = exec(
		`gh project item-list ${PROJECT_NUMBER} --owner ${OWNER} --format json`,
	).toString();

	const { items } = JSON.parse(listResult);

	// 1. Filter candidates (Todo or Paused)
	const candidates = items.filter((item) => {
		const status = item.status || "";
		return ["Todo", "Paused"].includes(status);
	});

	if (candidates.length === 0) {
		console.log("No candidates for execution.");
		return;
	}

	console.log(
		`Found ${candidates.length} candidates. Analyzing dependencies...`,
	);

	// 2. Analyze blockers and dependencies
	// We'll favor: Paused > Bug Label > P0 > P1 > P2
	const prioritized = candidates.sort((a, b) => {
		// Priority 1: Status Paused
		if (a.status === "Paused" && b.status !== "Paused") return -1;
		if (a.status !== "Paused" && b.status === "Paused") return 1;

		// Priority 2: Bug Label
		const isBugA = (a.labels || []).includes("bug");
		const isBugB = (b.labels || []).includes("bug");
		if (isBugA && !isBugB) return -1;
		if (!isBugA && isBugB) return 1;

		// Priority 3: Priority field (P0 > P1 > P2)
		const prioMap = { P0: 0, P1: 1, P2: 2 };
		const pA = prioMap[a.priority] ?? 3;
		const pB = prioMap[b.priority] ?? 3;
		if (pA !== pB) return pA - pB;

		return 0;
	});

	// 3. Find the first unblocked task
	let selectedTask = null;
	for (const task of prioritized) {
		console.log(`Checking task #${task.content.number}: ${task.content.title}`);

		const labels = task.labels || [];
		if (labels.includes("blocked")) {
			console.log(`Task #${task.content.number} is blocked. Skipping...`);
			continue;
		}

		selectedTask = task;
		break;
	}

	if (!selectedTask) {
		console.log("All candidates are blocked.");
		return;
	}

	const issueNumber = selectedTask.content.number;
	console.log(
		`>>> Selected Task: #${issueNumber} - ${selectedTask.content.title}`,
	);

	// 4. Mark task as "In Progress" to prevent race conditions
	console.log(`Marking task #${issueNumber} as In Progress...`);
	const projectItemId = selectedTask.id;
	try {
		exec(
			`gh project item-edit --id ${projectItemId} --project-id ${PROJECT_NUMBER} --field-id Status --text "In Progress"`,
		);
	} catch (err) {
		console.warn(`Warning: Could not update status: ${err.message}`);
	}

	// 5. Trigger Worker Workflow
	console.log(`Dispatching AI Worker for issue #${issueNumber}...`);
	exec(`gh workflow run ai-worker.yml -f issue_number=${issueNumber}`);
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
