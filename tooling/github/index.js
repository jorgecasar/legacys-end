import { Octokit } from "@octokit/rest";
import { PROJECT_ID } from "../config/index.js";

/**
 * Initialize Octokit with environment token
 * @param {typeof Octokit} [OctokitClass=Octokit] - Octokit class constructor (for dependency injection)
 * @returns {Octokit} Authenticated Octokit instance
 * @throws {Error} If GH_TOKEN environment variable is missing
 */
export function getOctokit(OctokitClass = Octokit) {
	const token = process.env.GH_TOKEN;
	if (!token) {
		throw new Error("Missing GH_TOKEN environment variable");
	}
	return new OctokitClass({ auth: token });
}

/**
 * Resolve an issue number to its details
 * @param {Octokit} octokit - Octokit instance
 * @param {Object} params - Parameters
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @returns {Promise<Object>} Issue details object
 */
export async function getIssue(octokit, { owner, repo, issueNumber }) {
	const { data: issue } = await octokit.rest.issues.get({
		owner,
		repo,
		issue_number: issueNumber,
	});
	return issue;
}

/**
 * Resolve an issue number to its GraphQL node_id
 * @param {Octokit} octokit - Octokit instance
 * @param {Object} params - Parameters
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @returns {Promise<string>} GraphQL node_id
 */
export async function getIssueNodeId(octokit, params) {
	const issue = await getIssue(octokit, params);
	return issue.node_id;
}

/**
 * Creates a native sub-issue relationship using GraphQL
 * @param {Octokit} octokit - Octokit instance
 * @param {string} parentId - Global ID of the parent issue
 * @param {string} childId - Global ID of the child issue
 * @returns {Promise<Object>} GraphQL mutation result
 */
export async function createSubIssue(octokit, parentId, childId) {
	const query = `
		mutation($parentId: ID!, $childId: ID!) {
			addSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
				subIssue {
					id
				}
			}
		}
	`;
	return octokit.graphql(query, {
		parentId,
		childId,
		headers: {
			"GraphQL-Features": "sub_issues",
		},
	});
}

/**
 * Get sub-issues of an issue
 * @param {Octokit} octokit - Octokit instance
 * @param {Object} params - Parameters
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @returns {Promise<Array<{number: number, state: string}>>} List of sub-issues
 */
export async function getSubIssues(octokit, { owner, repo, issueNumber }) {
	const query = `
		query($owner: String!, $repo: String!, $number: Int!) {
			repository(owner: $owner, name: $repo) {
				issue(number: $number) {
					subIssues(first: 10) {
						nodes {
							number
							state
						}
					}
				}
			}
		}
	`;

	try {
		const result = await octokit.graphql({
			query,
			owner,
			repo,
			number: issueNumber,
			headers: {
				"GraphQL-Features": "sub_issues",
			},
		});
		const nodes = result.repository?.issue?.subIssues?.nodes || [];
		return nodes;
	} catch (err) {
		console.warn(
			`Failed to fetch sub-issues for #${issueNumber}: ${err.message}`,
		);
		return [];
	}
}

/**
 * Check if an issue has open subtasks (Native Sub-issues)
 * @param {Octokit} octokit - Octokit instance
 * @param {Object} params - Parameters
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @returns {Promise<number>} Count of open sub-issues
 */
export async function hasOpenSubtasks(octokit, { owner, repo, issueNumber }) {
	const query = `
		query($owner: String!, $repo: String!, $number: Int!) {
			repository(owner: $owner, name: $repo) {
				issue(number: $number) {
					subIssues(first: 10) {
						nodes {
							state
						}
					}
				}
			}
		}
	`;

	try {
		const result = await octokit.graphql({
			query,
			owner,
			repo,
			number: issueNumber,
			headers: {
				"GraphQL-Features": "sub_issues",
			},
		});

		const subIssues = result.repository?.issue?.subIssues?.nodes || [];
		const openSubIssues = subIssues.filter((si) => si.state === "OPEN");
		return openSubIssues.length;
	} catch (err) {
		console.warn(`Failed to check native sub-issues: ${err.message}`);
		// Fallback to 0 if check fails
		return 0;
	}
}

/**
 * Add a comment to an issue
 * @param {Octokit} octokit - Octokit instance
 * @param {Object} params - Parameters
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @param {string} params.body - Comment body
 * @returns {Promise<Object>} Created comment object
 */
export async function addIssueComment(
	octokit,
	{ owner, repo, issueNumber, body },
) {
	return octokit.rest.issues.createComment({
		owner,
		repo,
		issue_number: issueNumber,
		body,
	});
}

/**
 * Ensures an issue is present in the Project V2 and returns its Item ID
 * @param {Octokit} octokit - Octokit instance
 * @param {string} contentId - Global Node ID of the issue
 * @returns {Promise<string>} Project Item ID
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
 * @param {Octokit} octokit - Octokit instance
 * @param {string} itemId - Project Item ID
 * @param {string} fieldId - Project Field ID
 * @param {string|number} value - Value to set
 * @returns {Promise<Object>} Mutation result
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

/**
 * Fetch items from the Project V2
 * @param {Octokit} octokit - Octokit instance
 * @returns {Promise<Array<Object>>} List of project items with details
 */
export async function fetchProjectItems(octokit) {
	const query = `
		query($projectId: ID!) {
			node(id: $projectId) {
				... on ProjectV2 {
					items(first: 100) {
						nodes {
							id
							content {
								... on Issue {
									number
									title
									body
									labels(first: 10) {
										nodes { name }
									}
									parent {
										number
										labels(first: 10) {
											nodes { name }
										}
									}
									subIssues(first: 20) {
										nodes {
											number
											title
											state
											labels(first: 5) {
												nodes { name }
											}
										}
									}
								}
							}
							status: fieldValueByName(name: "Status") {
								... on ProjectV2ItemFieldSingleSelectValue { name }
							}
							priority: fieldValueByName(name: "Priority") {
								... on ProjectV2ItemFieldSingleSelectValue { name }
							}
						}
					}
				}
			}
		}
	`;

	const result = await octokit.graphql({
		query,
		projectId: PROJECT_ID,
		headers: {
			"GraphQL-Features": "sub_issues",
		},
	});
	return result.node.items.nodes
		.map((item) => ({
			id: item.id,
			number: item.content?.number,
			title: item.content?.title,
			body: item.content?.body,
			status: item.status?.name,
			priority: item.priority?.name,
			labels: item.content?.labels?.nodes.map((l) => l.name) || [],
			parentLabels:
				item.content?.parent?.labels?.nodes.map((l) => l.name) || [],
			subIssues: (item.content?.subIssues?.nodes || []).map((s) => ({
				...s,
				labels: s.labels?.nodes.map((l) => l.name) || [],
			})),
		}))
		.filter((i) => i.number);
}
