#!/usr/bin/env node
import { execSync } from "node:child_process";
import { OWNER, REPO } from "../config/index.js";
import { createSubIssue, getIssueNodeId, getOctokit } from "./index.js";

async function main() {
	const parentNumber = parseInt(process.argv[2], 10);
	const title = process.argv[3];
	const body = process.argv[4];

	if (!parentNumber || !title || !body) {
		console.error(
			"Usage: node create-and-link-subissue.js <parent_number> <title> <body>",
		);
		process.exit(1);
	}

	try {
		console.log(`>>> Creating sub-issue: "${title}"...`);
		// We use the gh CLI to create the issue to get the number easily
		const cmd = `gh issue create --title "${title.replace(/"/g, '"')}" --body "${body.replace(/"/g, '"')}" --json number`;
		const output = execSync(cmd).toString();
		const { number: childNumber } = JSON.parse(output);

		console.log(
			`>>> Issue #${childNumber} created. Linking to #${parentNumber}...`,
		);

		const octokit = getOctokit();
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
		console.log(
			`✅ Successfully created and linked Issue #${childNumber} as sub-issue of #${parentNumber}.`,
		);
	} catch (error) {
		console.error(`❌ Error: ${error.message}`);
		process.exit(1);
	}
}

main();
