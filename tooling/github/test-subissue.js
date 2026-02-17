import { OWNER, REPO } from "../config/index.js";
import { createSubIssue, getIssueNodeId, getOctokit } from "./index.js";

async function testLink() {
	const parentNum = process.env.PARENT;
	const childNum = process.env.CHILD;

	if (!parentNum || !childNum) {
		console.error("Please provide PARENT and CHILD env vars");
		return;
	}

	const octokit = getOctokit();
	console.log(`Linking ${childNum} to ${parentNum}...`);

	try {
		const parentId = await getIssueNodeId(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber: parseInt(parentNum, 10),
		});
		const childId = await getIssueNodeId(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber: parseInt(childNum, 10),
		});

		console.log("Parent ID:", parentId);
		console.log("Child ID:", childId);

		const res = await createSubIssue(octokit, parentId, childId);
		console.log("Result:", JSON.stringify(res, null, 2));
	} catch (e) {
		console.error("Error:", e);
	}
}

testLink();
