import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";

export async function main({ exec = execSync, octokit: injectedOctokit } = {}) {
	const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
	if (!token && !injectedOctokit) {
		throw new Error("Missing GH_TOKEN");
	}

	const octokit = injectedOctokit || new Octokit({ auth: token });
	console.log("Fetching project items via GraphQL...");

	const query = `
		query($projectId: ID!) {
			node(id: $projectId) {
				... on ProjectV2 {
					items(first: 50) {
						nodes {
							id
							content {
								... on Issue {
									number
									title
									labels(first: 10) {
										nodes { name }
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

	const result = await octokit.graphql(query, { projectId: PROJECT_ID });
	const items = result.node.items.nodes
		.map((item) => ({
			id: item.id,
			number: item.content?.number,
			title: item.content?.title,
			status: item.status?.name,
			priority: item.priority?.name,
			labels: item.content?.labels?.nodes.map((l) => l.name) || [],
		}))
		.filter((i) => i.number);

	// 1. Filter candidates (Todo or Paused)
	const candidates = items.filter((item) => {
		return ["Todo", "Paused"].includes(item.status);
	});

	if (candidates.length === 0) {
		console.log("No candidates for execution.");
		return;
	}

	console.log(`Found ${candidates.length} candidates. Analyzing priorities...`);

	// 2. Prioritize: Paused > P0 > P1 > P2
	const prioritized = candidates.sort((a, b) => {
		if (a.status === "Paused" && b.status !== "Paused") return -1;
		if (a.status !== "Paused" && b.status === "Paused") return 1;

		const prioMap = { P0: 0, P1: 1, P2: 2 };
		const pA = prioMap[a.priority] ?? 3;
		const pB = prioMap[b.priority] ?? 3;
		if (pA !== pB) return pA - pB;

		return 0;
	});

	// 3. Find first unblocked
	let selectedTask = null;
	for (const task of prioritized) {
		if (task.labels.includes("blocked")) continue;
		selectedTask = task;
		break;
	}

	if (!selectedTask) {
		console.log("All candidates are blocked.");
		return;
	}

	console.log(
		`>>> Selected Task: #${selectedTask.number} - ${selectedTask.title}`,
	);

	// 4. Mark as In Progress
	console.log(`Marking task #${selectedTask.number} as In Progress...`);

	try {
		exec(
			`gh project item-edit --id ${selectedTask.id} --project-id ${PROJECT_ID} --field-id Status --text "In Progress"`,
		);
	} catch (err) {
		console.warn(`Warning: Could not update status: ${err.message}`);
	}

	// 5. Trigger Worker
	console.log(`Dispatching AI Worker for issue #${selectedTask.number}...`);
	exec(`gh workflow run ai-worker.yml -f issue_number=${selectedTask.number}`);
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
