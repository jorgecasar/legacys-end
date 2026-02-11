import { execSync } from "node:child_process";

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const PROJECT_NUMBER = 2;
const OWNER = "jorgecasar";

// Field IDs
const FIELD_IDS = {
	status: "PVTSSF_lAHOAA562c4BOtC-zg9U7KE",
	priority: "PVTSSF_lAHOAA562c4BOtC-zg9U7SY",
	size: "PVTSSF_lAHOAA562c4BOtC-zg9U7Sc",
	estimate: "PVTF_lAHOAA562c4BOtC-zg9U7Sg",
};

// Option IDs
const OPTIONS = {
	status: {
		todo: "f75ad846",
	},
	priority: {
		p0: "330b32fb",
		p1: "f692bf94",
		p2: "6b58477b",
	},
	size: {
		xs: "f9e9efe0",
		s: "f6fcfdf5",
		m: "6e1903e7",
		l: "af3f11f8",
		xl: "a9afd814",
	},
};

export async function main(input = process.argv[2], { exec = execSync } = {}) {
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

	const { issue_number, priority, size, estimate, labels = [] } = data;

	console.log(`Syncing issue #${issue_number}...`);

	// 1. Ensure issue is in project and get Item ID
	const addResult = exec(
		`gh project item-add ${PROJECT_NUMBER} --owner ${OWNER} --url "https://github.com/${OWNER}/legacys-end/issues/${issue_number}" --format json`,
	).toString();
	const item = JSON.parse(addResult);
	const itemId = item.id;

	console.log(`Item ID: ${itemId}`);

	// 2. Update Status to Todo
	exec(
		`gh project item-edit --id ${itemId} --project-id ${PROJECT_ID} --field-id ${FIELD_IDS.status} --single-select-option-id ${OPTIONS.status.todo}`,
	);

	// 3. Update Priority
	if (priority && OPTIONS.priority[priority.toLowerCase()]) {
		const optionId = OPTIONS.priority[priority.toLowerCase()];
		exec(
			`gh project item-edit --id ${itemId} --project-id ${PROJECT_ID} --field-id ${FIELD_IDS.priority} --single-select-option-id ${optionId}`,
		);
	}

	// 4. Update Size
	if (size && OPTIONS.size[size.toLowerCase()]) {
		const optionId = OPTIONS.size[size.toLowerCase()];
		exec(
			`gh project item-edit --id ${itemId} --project-id ${PROJECT_ID} --field-id ${FIELD_IDS.size} --single-select-option-id ${optionId}`,
		);
	}

	// 5. Update Estimate
	if (estimate !== undefined) {
		exec(
			`gh project item-edit --id ${itemId} --project-id ${PROJECT_ID} --field-id ${FIELD_IDS.estimate} --number ${estimate}`,
		);
	}

	// 6. Update Labels on the issue itself
	if (labels.length > 0) {
		const labelsStr = labels.join(",");
		exec(`gh issue edit ${issue_number} --add-label "${labelsStr}"`);
	}

	console.log("Sync complete.");
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
