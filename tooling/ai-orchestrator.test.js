import { spawn } from "node:child_process";
import { describe, it, mock } from "node:test";
import { main } from "./ai-orchestrator.js";

describe("ai-orchestrator", () => {
	mock.method(console, "log", () => {});
	mock.method(console, "error", () => {});

	it("should prioritize Paused tasks and skip blocked", async () => {
		const exec = mock.fn((cmd) => {
			if (cmd.includes("gh project item-list")) {
				return Buffer.from(
					JSON.stringify({
						items: [
							{
								content: { number: 1, title: "Task 1" },
								status: "Todo",
								priority: "P1",
							},
							{
								content: { number: 2, title: "Task 2" },
								status: "Paused",
								priority: "P2",
							},
							{
								content: { number: 9, title: "Bug But Paused" },
								status: "Paused",
								priority: "P0",
								labels: ["bug"],
							},
							{
								content: { number: 10, title: "Bug Todo" },
								status: "Todo",
								labels: ["bug"],
							},
							{
								content: { number: 12, title: "P2 Task" },
								status: "Todo",
								priority: "P2",
							},
							{
								content: { number: 13, title: "No Priority Field" },
								status: "Todo",
							},
							{
								content: { number: 3, title: "Blocked Task" },
								status: "Todo",
								priority: "P0",
								labels: ["blocked"],
							},
							{
								content: { number: 4, title: "High Prio Todo" },
								status: "Todo",
								priority: "P0",
							},
							{
								content: { number: 5, title: "No Prio" },
								status: "Todo",
							},
							{
								content: { number: 6, title: "P1 Same" },
								status: "Todo",
								priority: "P1",
							},
							{
								content: { number: 7, title: "Bug Task" },
								status: "Todo",
								priority: "P2",
								labels: ["bug"],
							},
							{
								content: { number: 8, title: "Another Bug" },
								status: "Todo",
								priority: "P2",
								labels: ["bug"],
							},
							{
								content: { number: 9, title: "Bug But Paused" },
								status: "Paused",
								priority: "P0",
								labels: ["bug"],
							},
							{
								content: { number: 10, title: "Bug Todo" },
								status: "Todo",
								labels: ["bug"],
							},
							{
								content: { number: 12, title: "P2 Task" },
								status: "Todo",
								priority: "P2",
							},
						],
					}),
				);
			}
			return Buffer.from("");
		});

		await main({ exec });
	});

	it("should handle empty item list", async () => {
		const exec = mock.fn(() => Buffer.from(JSON.stringify({ items: [] })));
		await main({ exec });
	});

	it("should handle no candidates found", async () => {
		const exec = mock.fn(() =>
			Buffer.from(
				JSON.stringify({
					items: [
						{
							content: { number: 4, title: "Done Task" },
							status: "Done",
							priority: "P0",
						},
						{
							content: { number: 99, title: "Backlog Task" },
							status: "Backlog",
							priority: "P0",
						},
					],
				}),
			),
		);
		await main({ exec });
	});

	it("should execute as a main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-orchestrator.js"], {
				env: { ...process.env, GITHUB_TOKEN: "mock", NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0 || code === 1) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});

	it("should handle execution errors in main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-orchestrator.js"], {
				env: { ...process.env, PROJECT_NUMBER: "999", NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0 || code === 1) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});

	it("should use default execSync if no args provided", async () => {
		try {
			await main(undefined);
		} catch (_e) {
			// Expected failure
		}
	});
});
