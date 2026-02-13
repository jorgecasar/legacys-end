import assert from "node:assert";
import { spawn } from "node:child_process";
import { describe, it, mock } from "node:test";

import { orchestrateExecution } from "./orchestrator.js";

describe("ai-orchestrator", () => {
	process.env.GH_TOKEN = "mock-token";
	mock.method(console, "log", () => {});
	mock.method(console, "error", () => {});

	it("should prioritize Paused tasks and skip blocked, containers, or blocked parents", async () => {
		const octokit = {
			graphql: mock.fn(() => ({
				node: {
					items: {
						nodes: [
							{
								id: "1",
								content: {
									number: 1,
									title: "Task 1",
									labels: { nodes: [] },
									parent: null,
									subIssues: { nodes: [] },
								},
								status: { name: "Todo" },
								priority: { name: "P1" },
							},
							{
								id: "2",
								content: {
									number: 2,
									title: "Task 2 (Paused)",
									labels: { nodes: [] },
									parent: null,
									subIssues: { nodes: [] },
								},
								status: { name: "Paused" },
								priority: { name: "P2" },
							},
							{
								id: "3",
								content: {
									number: 3,
									title: "Blocked",
									labels: { nodes: [{ name: "blocked" }] },
									parent: null,
									subIssues: { nodes: [] },
								},
								status: { name: "Todo" },
								priority: { name: "P0" },
							},
							{
								id: "4",
								content: {
									number: 4,
									title: "Container Task",
									labels: { nodes: [] },
									parent: null,
									subIssues: { nodes: [{ number: 5, state: "OPEN" }] },
								},
								status: { name: "Todo" },
								priority: { name: "P0" },
							},
							{
								id: "6",
								content: {
									number: 6,
									title: "Blocked Parent Task",
									labels: { nodes: [] },
									parent: {
										number: 10,
										labels: { nodes: [{ name: "blocked" }] },
									},
									subIssues: { nodes: [] },
								},
								status: { name: "Todo" },
								priority: { name: "P0" },
							},
						],
					},
				},
			})),
			rest: {
				actions: {
					createWorkflowDispatch: mock.fn(() => Promise.resolve({ data: {} })),
				},
			},
		};

		await orchestrateExecution({ octokit });

		const logMessages = console.log.mock.calls.map((c) => c.arguments[0]);
		const selectedLog = logMessages.find((m) =>
			m.includes(">>> Selected Task"),
		);
		assert.match(selectedLog, /#2/);
	});

	it("should handle empty item list", async () => {
		const octokit = {
			graphql: mock.fn(() => ({
				node: { items: { nodes: [] } },
			})),
		};
		await orchestrateExecution({ octokit });
	});

	it("should handle no candidates found", async () => {
		const octokit = {
			graphql: mock.fn(() => ({
				node: {
					items: {
						nodes: [
							{
								id: "4",
								content: {
									number: 4,
									title: "Done",
									labels: { nodes: [] },
									parent: null,
									subIssues: { nodes: [] },
								},
								status: { name: "Done" },
							},
						],
					},
				},
			})),
		};
		await orchestrateExecution({ octokit });
	});

	it("should execute as a main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-orchestration/orchestrator.js"], {
				env: { ...process.env, GITHUB_TOKEN: "mock", NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0 || code === 1) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});
});
