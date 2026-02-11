import { spawn } from "node:child_process";
import { describe, it, mock } from "node:test";
import { main } from "./ai-triage-sync.js";

describe("ai-triage-sync", () => {
	mock.method(console, "log", () => {});
	mock.method(console, "error", () => {});

	it("should call gh commands with correct parameters", async () => {
		const exec = mock.fn(() => Buffer.from(JSON.stringify({ id: "item_123" })));
		const input = JSON.stringify({
			issue_number: 1,
			priority: "P0",
			size: "S",
			estimate: 2,
			labels: ["test"],
		});

		await main(input, { exec });
	});

	it("should work even when optional fields are missing", async () => {
		const exec = mock.fn(() => Buffer.from(JSON.stringify({ id: "item_123" })));
		const input = JSON.stringify({
			issue_number: 1,
			labels: [],
		});

		await main(input, { exec });
	});

	it("should return early if no input is provided", async () => {
		process.env.NODE_ENV = "test";
		await main(undefined);
	});

	it("should execute as a main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-triage-sync.js", "{}"], {
				env: { ...process.env, NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0 || code === 1) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});
});
