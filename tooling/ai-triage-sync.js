import { Octokit } from "@octokit/rest";

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const OWNER = "jorgecasar";
const REPO = "legacys-end";

// Field IDs (obtained from project settings)
const FIELD_IDS = {
	status: "PVTSSF_lAHOAA562c4BOtC-zg9U7KE",
	priority: "PVTSSF_lAHOAA562c4BOtC-zg9U7SY",
	model: "PVTF_lAHOAA562c4BOtC-zg9g9xk",
	cost: "PVTF_lAHOAA562c4BOtC-zg9hBOw",
};

// Option IDs for single-select fields
const OPTIONS = {
	status: {
		todo: "f75ad846",
	},
	priority: {
		p0: "330b32fb",
		p1: "f692bf94",
		p2: "6b58477b",
	},
	model: {
		// model is now a text field, no options needed
	},
};

export async function main(
	input = process.argv[2],
	{
		octokit = new Octokit({
			auth: process.env.GH_TOKEN,
		}),
	} = {},
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
	const { data: issue } = await octokit.rest.issues.get({
		owner: OWNER,
		repo: REPO,
		issue_number: issueNumber,
	});
	const issueNodeId = issue.node_id;

	// 2. Add issue to project using GraphQL (Projects V2 only supports GraphQL)
	const addResult = await octokit.graphql(
		`mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }`,
		{
			projectId: PROJECT_ID,
			contentId: issueNodeId,
		},
	);

	const itemId = addResult.addProjectV2ItemById.item.id;
	console.log(`Item ID: ${itemId}`);

	// 3. Update Status to Todo
	await octokit.graphql(
		`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item {
          id
        }
      }
    }`,
		{
			projectId: PROJECT_ID,
			itemId,
			fieldId: FIELD_IDS.status,
			optionId: OPTIONS.status.todo,
		},
	);

	// 4. Update Priority
	if (priority && OPTIONS.priority[priority.toLowerCase()]) {
		const optionId = OPTIONS.priority[priority.toLowerCase()];
		await octokit.graphql(
			`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item {
            id
          }
        }
      }`,
			{
				projectId: PROJECT_ID,
				itemId,
				fieldId: FIELD_IDS.priority,
				optionId,
			},
		);
	}

	// 5. Update Model (Text field)
	if (model) {
		await octokit.graphql(
			`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { text: $value }
        }) {
          projectV2Item {
            id
          }
        }
      }`,
			{
				projectId: PROJECT_ID,
				itemId,
				fieldId: FIELD_IDS.model,
				value: model,
			},
		);
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
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
