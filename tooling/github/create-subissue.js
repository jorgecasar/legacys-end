#!/usr/bin/env node
import { OWNER, REPO } from "../config/index.js";
import { createSubIssue, getIssueNodeId, getOctokit } from "./index.js";

async function main() {
	const parentNumber = parseInt(process.argv[2], 10);
	const childNumber = parseInt(process.argv[3], 10);

	if (Number.isNaN(parentNumber) || Number.isNaN(childNumber)) {
		console.error(
			"Usage: node create-subissue.js <parent_number> <child_number>",
		);
		process.exit(1);
	}

	const octokit = getOctokit();
	console.log(
		`Linking Issue #${childNumber} as sub-issue of #${parentNumber}...`,
	);

	try {
		const parentId = await getIssueNodeId(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber: parentNumber,
		});
		const childId = await getIssueNodeId(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber: childNumber,
		});

		await createSubIssue(octokit, parentId, childId);
		console.log("✅ Successfully linked native sub-issue.");
	} catch (error) {
		console.error(`❌ Failed to link sub-issue: ${error.message}`);
		process.exit(1);
	}
}

main();
