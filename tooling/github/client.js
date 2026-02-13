import { OWNER, REPO } from "../config/index.js";

/**
 * Relationship types for linking issues in GitHub
 * @enum {string}
 */
export const ISSUE_RELATIONSHIP_TYPE = {
	TRACKS: "TRACKS",
	TRACKED_BY: "TRACKED_BY",
	BLOCKS: "BLOCKS",
	BLOCKED_BY: "BLOCKED_BY",
};

/**
 * Associate an issue as a sub-issue of another via GraphQL (Native Sub-issues)
 * @param {Object} octokit - Octokit instance
 * @param {string} parentNodeId - Parent issue node ID
 * @param {string} subIssueNodeId - Sub-issue issue node ID
 * @returns {Promise<Object|null>} Created relationship or null
 */
export async function addNativeSubIssue(octokit, parentNodeId, subIssueNodeId) {
	const mutation = `
		mutation($parent: ID!, $subIssue: ID!) {
			addSubIssue(input: {
				issueId: $parent
				subIssueId: $subIssue
			}) {
				subIssue {
					id
				}
			}
		}
	`;

	try {
		const result = await octokit.graphql({
			query: mutation,
			parent: parentNodeId,
			subIssue: subIssueNodeId,
			headers: {
				"GraphQL-Features": "sub_issues",
			},
		});
		return result.addSubIssue?.subIssue;
	} catch (err) {
		console.warn(`Failed to associate native sub-issue: ${err.message}`);
		return null;
	}
}

/**
 * Create a relationship between two issues via GraphQL (Linked Issues)
 * @param {Object} octokit - Octokit instance
 * @param {string} sourceNodeId - Source issue node ID
 * @param {string} targetNodeId - Target issue node ID
 * @param {keyof typeof ISSUE_RELATIONSHIP_TYPE} type - Relationship type (BLOCKS, BLOCKED_BY, TRACKS, TRACKED_BY)
 * @returns {Promise<Object|null>} Created relationship or null
 */
export async function createIssueRelationship(
	octokit,
	sourceNodeId,
	targetNodeId,
	type = ISSUE_RELATIONSHIP_TYPE.TRACKED_BY,
) {
	const mutation = `
		mutation {
			createLinkedIssues(input: {
				clientMutationId: "link-issue-${Date.now()}"
				linkedIssueFormInput: {
					issueId: "${sourceNodeId}"
					type: ${type}
					relatedIssueId: "${targetNodeId}"
				}
			}) {
				linkedIssues {
					id
					type
				}
			}
		}
	`;

	try {
		const result = await octokit.graphql(mutation);
		return result.createLinkedIssues?.linkedIssues?.[0];
	} catch (err) {
		console.warn(`Failed to create relationship (${type}): ${err.message}`);
		return null;
	}
}

/**
 * Mark issue A as blocked by issue B via GraphQL
 */
export async function markIssueAsBlockedBy(
	octokit,
	blockedIssueNumber,
	blockerIssueNumber,
) {
	// Get both issues' node IDs
	try {
		const query = `
			query {
				repo1: repository(owner: "${OWNER}", name: "${REPO}") {
					blocked: issue(number: ${blockedIssueNumber}) {
						id
					}
				}
				repo2: repository(owner: "${OWNER}", name: "${REPO}") {
					blocker: issue(number: ${blockerIssueNumber}) {
						id
					}
				}
			}
		`;
		const result = await octokit.graphql(query);
		const blockedId = result.repo1?.blocked?.id;
		const blockerId = result.repo2?.blocker?.id;

		if (!blockedId || !blockerId) {
			console.warn(`Could not fetch issue node IDs`);
			return null;
		}

		const linked = await createIssueRelationship(
			octokit,
			blockedId,
			blockerId,
			ISSUE_RELATIONSHIP_TYPE.BLOCKED_BY,
		);
		if (linked) {
			console.log(
				`✓ Marked issue #${blockedIssueNumber} as blocked by #${blockerIssueNumber}`,
			);
		}
		return linked;
	} catch (err) {
		console.warn(`Failed to mark issue as blocked: ${err.message}`);
		return null;
	}
}

/**
 * Create subtasks for a parent issue
 * @param {Object} octokit - Octokit instance
 * @param {number} parentIssueNumber - Parent issue number
 * @param {Array<Object>} subtasks - Array of subtask objects with title and goal
 * @returns {Promise<Array<number>>} Array of created subtask numbers
 */
export async function createSubtasks(octokit, parentIssueNumber, subtasks) {
	const actionableSubs = (subtasks || []).filter(
		(s) => s.blocked !== true && s.ready !== false,
	);

	if (actionableSubs.length === 0) {
		console.log(
			"No actionable subtasks found (all blocked or not ready). Skipping creation.",
		);
		return [];
	}

	console.log(
		`Checking for duplicates before creating ${actionableSubs.length} subtask(s)...`,
	);

	// 1. Fetch existing open issues that reference this parent
	let existingReferences = [];
	try {
		const { data: openIssues } = await octokit.rest.issues.listForRepo({
			owner: OWNER,
			repo: REPO,
			state: "open",
			per_page: 100, // Reasonable limit to check recent duplicates
		});

		existingReferences = openIssues.filter(
			(i) => i.body && i.body.includes(`Parent issue: #${parentIssueNumber}`),
		);
	} catch (err) {
		console.warn(
			`Warning: Could not check for existing duplicates: ${err.message}`,
		);
	}

	const created = [];

	// Get parent issue node ID
	let parentNodeId = null;
	try {
		const parentQuery = `
			query {
				repository(owner: "${OWNER}", name: "${REPO}") {
					issue(number: ${parentIssueNumber}) {
						id
					}
				}
			}
		`;
		const parentResult = await octokit.graphql(parentQuery);
		parentNodeId = parentResult.repository?.issue?.id;
	} catch (err) {
		console.warn(`Could not fetch parent node ID: ${err.message}`);
	}

	for (const sub of actionableSubs) {
		// Check for duplicate by title match within the filtered list
		const isDuplicate = existingReferences.some(
			(existing) =>
				existing.title === sub.title || existing.title.includes(sub.title),
		);

		if (isDuplicate) {
			console.log(
				`⚠️  Skipping duplicate subtask: "${sub.title}" (already exists)`,
			);
			continue;
		}

		try {
			const bodyText = `Parent issue: #${parentIssueNumber}.\n\nGoal: ${sub.goal || ""}`;
			const response = await octokit.rest.issues.create({
				owner: OWNER,
				repo: REPO,
				title: sub.title || "Untitled subtask",
				body: bodyText,
			});
			const subtaskNumber = response.data.number;
			console.log(`✓ Created sub-issue #${subtaskNumber}: ${sub.title}`);
			created.push({ number: subtaskNumber, title: sub.title });

			// Create GraphQL relationship if parent node ID available
			if (parentNodeId) {
				const childNodeId = response.data.node_id;
				const linked = await addNativeSubIssue(
					octokit,
					parentNodeId,
					childNodeId,
				);
				if (linked) {
					console.log(
						`✓ Linked #${subtaskNumber} to parent #${parentIssueNumber} natively as Sub-issue`,
					);
				} else {
					console.warn(
						`⚠️  Failed to link #${subtaskNumber} as native sub-issue. It remains as a text-linked issue.`,
					);
				}
			}
		} catch (err) {
			console.warn(`Failed to create subtask "${sub.title}": ${err.message}`);
		}
	}

	return created;
}
