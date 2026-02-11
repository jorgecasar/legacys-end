import { Octokit } from "@octokit/rest";

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
const OWNER = "jorgecasar";
const REPO = "legacys-end";

// Field IDs (obtained from project settings)
const FIELD_IDS = {
	status: "PVTSSF_lAHOAA562c4BOtC-zg9U7KE",
	priority: "PVTSSF_lAHOAA562c4BOtC-zg9U7SY",
	size: "PVTSSF_lAHOAA562c4BOtC-zg9U7Sc",
	estimate: "PVTF_lAHOAA562c4BOtC-zg9U7Sg",
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
	size: {
		xs: "f9e9efe0",
		s: "f6fcfdf5",
		m: "6e1903e7",
		l: "af3f11f8",
		xl: "a9afd814",
	},
};

export async function main(
	input = process.argv[2],
	{
		octokit = new Octokit({
			auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GH_TOKEN,
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

	const { issue_number, priority, size, estimate, labels = [] } = data;

	console.log(`Syncing issue #${issue_number}...`);

	// 1. Get issue node_id
	const { data: issue } = await octokit.rest.issues.get({
		owner: OWNER,
		repo: REPO,
		issue_number,
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

	// 5. Update Size
	if (size && OPTIONS.size[size.toLowerCase()]) {
		const optionId = OPTIONS.size[size.toLowerCase()];
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
				fieldId: FIELD_IDS.size,
				optionId,
			},
		);
	}

	// 6. Update Estimate
	if (estimate !== undefined) {
		await octokit.graphql(
			`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $number: Float!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { number: $number }
        }) {
          projectV2Item {
            id
          }
        }
      }`,
			{
				projectId: PROJECT_ID,
				itemId,
				fieldId: FIELD_IDS.estimate,
				number: estimate,
			},
		);
	}

	// 7. Update Labels on the issue itself
	if (labels.length > 0) {
		await octokit.rest.issues.addLabels({
			owner: OWNER,
			repo: REPO,
			issue_number,
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
