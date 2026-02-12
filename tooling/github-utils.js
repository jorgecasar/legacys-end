import { Octokit } from "@octokit/rest";
import { PROJECT_ID } from "./ai-config.js";

/**
 * Initialize Octokit with environment token
 */
export function getOctokit() {
	const token = process.env.GH_TOKEN;
	if (!token) {
		throw new Error("Missing GH_TOKEN environment variable");
	}
	return new Octokit({ auth: token });
}

/**
 * Resolve an issue number to its GraphQL node_id
 */
export async function getIssueNodeId(octokit, { owner, repo, issueNumber }) {
	const { data: issue } = await octokit.rest.issues.get({
		owner,
		repo,
		issue_number: issueNumber,
	});
	return issue.node_id;
}

/**
 * Ensures an issue is present in the Project V2 and returns its Item ID
 */
export async function addIssueToProject(octokit, contentId) {
	const result = await octokit.graphql(
		`mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item { id }
      }
    }`,
		{ projectId: PROJECT_ID, contentId },
	);
	return result.addProjectV2ItemById.item.id;
}

/**
 * Universal Project V2 Field Updater
 * Handles Text, Number, and Single Select options automatically.
 */
export async function updateProjectField(octokit, itemId, fieldId, value) {
	let valuePayload;

	if (typeof value === "number") {
		valuePayload = { number: value };
	} else if (
		typeof value === "string" &&
		/^[a-z0-9]{8}$/i.test(value) &&
		fieldId.startsWith("PVTSSF")
	) {
		// Heuristic: If it looks like an option ID (8 chars) and field is SingleSelect
		valuePayload = { singleSelectOptionId: value };
	} else {
		valuePayload = { text: String(value) };
	}

	return await octokit.graphql(
		`mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: $value
      }) {
        projectV2Item { id }
      }
    }`,
		{
			projectId: PROJECT_ID,
			itemId,
			fieldId,
			value: valuePayload,
		},
	);
}
