import { FIELD_IDS, OPTION_IDS, OWNER, REPO } from "./ai-config.js";
import {
	addIssueToProject,
	getIssueNodeId,
	getOctokit,
	updateProjectField,
} from "./github-utils.js";

export async function syncTriageData(
	input = process.argv[2],
	{ octokit = getOctokit() } = {},
) {
	if (!input || input.trim() === "") {
		console.error("Error: No JSON input provided.");
		console.error("Usage: node tooling/ai-triage-sync.js '<json_string>'");
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	let data;
	try {
		data = JSON.parse(input);
	} catch (err) {
		console.error("Error: Invalid JSON input");
		console.error("Input was:", input);
		console.error("Parse error:", err.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	const { issue_number, model, priority, labels = [] } = data;
	console.log(
		`Debug - Syncing: issue=${issue_number}, model=${model}, priority=${priority}`,
	);

	// Extract issue_number from context if not provided
	const issueNumber =
		issue_number || Number.parseInt(process.env.GITHUB_ISSUE_NUMBER, 10);

	if (!issueNumber) {
		console.error("Error: issue_number not provided in JSON or environment");
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	console.log(`Syncing issue #${issueNumber}...`);

	// 1. Get issue node_id
	const issueNodeId = await getIssueNodeId(octokit, {
		owner: OWNER,
		repo: REPO,
		issueNumber,
	});

	// 2. Add issue to project
	const itemId = await addIssueToProject(octokit, issueNodeId);
	console.log(`Item ID: ${itemId}`);

	// 3. Update Status to Todo
	await updateProjectField(
		octokit,
		itemId,
		FIELD_IDS.status,
		OPTION_IDS.status.todo,
	);

	// 4. Update Priority
	if (priority && OPTION_IDS.priority[priority.toLowerCase()]) {
		console.log(`Updating priority to ${priority}...`);
		const optionId = OPTION_IDS.priority[priority.toLowerCase()];
		await updateProjectField(octokit, itemId, FIELD_IDS.priority, optionId);
	}

	// 5. Update Model (Text field)
	if (model) {
		console.log(`Updating model to ${model}...`);
		await updateProjectField(octokit, itemId, FIELD_IDS.model, model);
	}

	// 7. Update Labels on the issue itself
	if (labels.length > 0) {
		await octokit.rest.issues.addLabels({
			owner: OWNER,
			repo: REPO,
			issue_number: issueNumber,
			labels,
		});
	}

	console.log("Sync complete.");
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	syncTriageData().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
