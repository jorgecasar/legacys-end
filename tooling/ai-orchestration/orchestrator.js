import { execSync } from "node:child_process";
import { FIELD_IDS, OPTION_IDS, OWNER, REPO } from "../config/index.js";
import {
	fetchProjectItems,
	getOctokit,
	updateProjectField,
} from "../github/index.js";

export async function orchestrateExecution({
	exec = execSync,
	octokit: injectedOctokit,
} = {}) {
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

	console.log(`Found ${candidates.length} candidates. Analyzing priorities...`);

	// 2. Prioritize: Paused > P0 > P1 > P2
	const prioritized = candidates.sort((a, b) => {
		if (a.status === "Paused" && b.status !== "Paused") return -1;
		if (a.status !== "Paused" && b.status === "Paused") return 1;

		const prioMap = { P0: 0, P1: 1, P2: 2 };
		const pA = prioMap[a.priority] ?? 3;
		const pB = prioMap[b.priority] ?? 3;
		if (pA !== pB) return pA - pB;

		return 0;
	});

	// 3. Find first unblocked "leaf" task
	let selectedTask = null;
	for (const task of prioritized) {
		if (task.labels.includes("blocked")) continue;
		if (task.parentLabels.includes("blocked")) {
			console.log(`Skipping #${task.number}: Parent is blocked.`);
			continue;
		}
		const pendingSubIssues = task.subIssues.filter((s) => s.state === "OPEN");
		if (pendingSubIssues.length > 0) {
			console.log(
				`Skipping #${task.number} (${task.status}): Has ${pendingSubIssues.length} pending sub-issues.`,
			);
			continue;
		}
		selectedTask = task;
		break;
	}

	if (!selectedTask) {
		console.log("All candidates are blocked.");
		return null;
	}

	console.log(
		`>>> Selected Task: #${selectedTask.number} - ${selectedTask.title}`,
	);

	// 4. Mark as In Progress
	console.log(`Marking task #${selectedTask.number} as In Progress...`);

	try {
		await updateProjectField(
			octokit,
			selectedTask.id,
			FIELD_IDS.status,
			OPTION_IDS.status.inProgress,
		);
	} catch (err) {
		console.warn(
			`Warning: Could not update status via GraphQL: ${err.message}`,
		);
	}

	// 5. Trigger or Return
	if (process.env.LOCAL_EXECUTION === "true") {
		console.log(`LOCAL_SELECTED_ISSUE=${selectedTask.number}`);
		console.log(`LOCAL_SELECTED_TITLE=${selectedTask.title}`);
		// Store body in a temp file or output it if short, but shell scripts handle it better via env
		return selectedTask;
	}

	console.log(`Dispatching AI Worker for issue #${selectedTask.number}...`);
	try {
		const command = `gh workflow run ai-worker.yml -f issue_number=${selectedTask.number} --repo ${OWNER}/${REPO} --ref main`;
		console.log(`Running: ${command}`);
		const output = exec(command, { encoding: "utf8" });
		if (output) console.log(`Output: ${output}`);
		console.log("✓ Dispatch successful.");
	} catch (err) {
		console.error(`❌ Failed to dispatch worker: ${err.message}`);
		if (err.stderr) console.error(`Stderr: ${err.stderr}`);
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
