import { fileURLToPath } from "node:url";
import * as configModule from "../config/index.js";
import * as pricingModule from "../gemini/pricing.js";
import * as githubModule from "../github/index.js";

const REPORT_HEADER = "### 🤖 AI Cost Report";

function parseCost(costStr) {
	if (!costStr) return 0;
	const clean = costStr.replace("$", "").trim();
	return parseFloat(clean) || 0;
}

/**
 * Sync logic for AI costs and project fields
 * @param {Object} [deps={}] - Injected dependencies
 */
export async function sync(deps = {}) {
	const {
		getOctokit = githubModule.getOctokit,
		fetchProjectItems = githubModule.fetchProjectItems,
		updateProjectField = githubModule.updateProjectField,
		getIssueNodeId = githubModule.getIssueNodeId,
		addIssueToProject = githubModule.addIssueToProject,
		addIssueComment = githubModule.addIssueComment,
		calculateCost = pricingModule.calculateCost,
		FIELD_IDS = configModule.FIELD_IDS,
		OPTION_IDS = configModule.OPTION_IDS,
		OWNER = configModule.OWNER,
		REPO = configModule.REPO,
		env = process.env,
	} = deps;

	const issueNumber = parseInt(env.ISSUE_NUMBER, 10);
	const isFailed = process.argv.includes("--failed");

	if (!issueNumber) {
		console.error("Missing ISSUE_NUMBER env var.");
		if (env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	const octokit = getOctokit();
	const items = await fetchProjectItems(octokit);
	let item = items.find((i) => i.number === issueNumber);

	if (!item) {
		console.log(`Issue #${issueNumber} not found in project. Adding it...`);
		const nodeId = await getIssueNodeId(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber,
		});
		const itemId = await addIssueToProject(octokit, nodeId);
		item = { id: itemId };
	}

	if (isFailed) {
		console.log(`Marking #${issueNumber} as Paused due to failure.`);
		await updateProjectField(
			octokit,
			item.id,
			FIELD_IDS.status,
			OPTION_IDS.status.paused,
		);
		await addIssueComment(octokit, {
			owner: OWNER,
			repo: REPO,
			issueNumber,
			body: "❌ **Task Paused**\n\nThe AI Agent failed to complete the task. Please review the logs.",
		});
		return;
	}

	// Define phases and their token counts
	const inputs = {
		Triage: {
			input: parseInt(env.TRIAGE_INPUT_TOKENS || "0", 10),
			output: parseInt(env.TRIAGE_OUTPUT_TOKENS || "0", 10),
			model: "gemini-2.5-flash-lite",
		},
		Planning: {
			input: parseInt(env.PLANNING_INPUT_TOKENS || "0", 10),
			output: parseInt(env.PLANNING_OUTPUT_TOKENS || "0", 10),
			model: "gemini-2.5-flash-lite",
		},
		Development: {
			input: parseInt(env.DEVELOPER_INPUT_TOKENS || "0", 10),
			output: parseInt(env.DEVELOPER_OUTPUT_TOKENS || "0", 10),
			model: "gemini-2.5-flash-lite",
		},
	};

	let sessionCost = 0;
	let newRows = "";
	const date = new Date().toISOString().split("T")[0];

	for (const [phase, data] of Object.entries(inputs)) {
		if (data.input > 0 || data.output > 0) {
			const report = calculateCost(data.model, data.input, data.output);
			sessionCost += report.totalCost;
			newRows += `| ${date} | ${phase} | ${data.model} | ${data.input} | ${data.output} | $${report.totalCost.toFixed(6)} |\n`;
		}
	}

	if (sessionCost > 0) {
		console.log(
			`Syncing session cost for #${issueNumber}: $${sessionCost.toFixed(4)}`,
		);

		const { data: comments } = await octokit.rest.issues.listComments({
			owner: OWNER,
			repo: REPO,
			issue_number: issueNumber,
		});
		const existingComment = comments.find((c) =>
			c.body?.includes(REPORT_HEADER),
		);

		let finalBody = "";
		let totalCumulativeCost = sessionCost;

		if (existingComment) {
			const lines = existingComment.body.split("\n");
			const existingRows = lines.filter((l) =>
				/^\s*\|\s*\d{4}-\d{2}-\d{2}/.test(l),
			);

			let previousTotal = 0;
			existingRows.forEach((row) => {
				const cols = row.split("|");
				if (cols.length >= 7) {
					previousTotal += parseCost(cols[6]);
				}
			});

			totalCumulativeCost = previousTotal + sessionCost;

			finalBody = `${REPORT_HEADER}

| Date | Phase | Model | Input | Output | Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
${existingRows.join("\n")}
${newRows.trim()}

**Total Cumulative Cost: $${totalCumulativeCost.toFixed(6)}**`;

			await octokit.rest.issues.updateComment({
				owner: OWNER,
				repo: REPO,
				comment_id: existingComment.id,
				body: finalBody.trim(),
			});
			console.log("Updated existing cost report.");
		} else {
			// Create new report
			finalBody = `${REPORT_HEADER}

| Date | Phase | Model | Input | Output | Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
${newRows.trim()}

**Total Cumulative Cost: $${sessionCost.toFixed(6)}**`;

			await addIssueComment(octokit, {
				owner: OWNER,
				repo: REPO,
				issueNumber,
				body: finalBody.trim(),
			});
			console.log("Created new cost report.");
		}

		// Update Project Field with the CUMULATIVE total
		await updateProjectField(
			octokit,
			item.id,
			FIELD_IDS.cost,
			totalCumulativeCost,
		);
		await updateProjectField(
			octokit,
			item.id,
			FIELD_IDS.model,
			"gemini-2.5-flash-lite",
		);
	}
}

// Named handler to achieve 100% function coverage
export function handleFatalError(err) {
	console.error(err);
	process.exit(1);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	sync().catch(handleFatalError);
}
