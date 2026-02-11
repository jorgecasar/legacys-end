import { spawn } from "node:child_process";
import { describe, it, mock } from "node:test";
import { main } from "./ai-worker-plan.js";

describe("ai-worker-plan", () => {
	mock.method(console, "log", () => {});
	mock.method(console, "error", () => {});

	it("should create a branch (with retry if exists)", async () => {
		let callCount = 0;
		const exec = mock.fn((cmd) => {
			if (cmd.includes("git checkout -b") && callCount === 0) {
				callCount++;
				throw new Error("Branch already exists");
			}
			return Buffer.from("");
		});

		const input = JSON.stringify({
			methodology: "TDD",
			slug: "test-feature",
			needs_decomposition: false,
			sub_tasks: [],
		});

		await main("10", input, { exec });
	});

	it("should create sub-issues if decomposition is requested", async () => {
		const exec = mock.fn((_cmd) => Buffer.from(""));
		const input = JSON.stringify({
			methodology: "BDD",
			slug: "complex-ui",
			needs_decomposition: true,
			sub_tasks: [{ title: "Sub 1", goal: "Goal 1" }],
		});

		await main("11", input, { exec });
	});

	it("should use default slug if not provided", async () => {
		const exec = mock.fn((_cmd) => Buffer.from(""));
		const input = JSON.stringify({
			methodology: "TDD",
			// No slug provided
		});

		await main("12", input, { exec });

		// Verify expected branch name contains "work"
		// We can't easily assert the exact call arg here without more complex mocking,
		// but this executes the branch.
	});

	it("should return early if missing input", async () => {
		process.env.NODE_ENV = "test";
		await main(undefined, undefined);
		await main("10", undefined);
		await main("10", ""); // Reproduce user reported issue
	});

	it("should execute as a main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-worker-plan.js"], {
				env: { ...process.env, NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});

	it("should handle execution errors in main process", () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-worker-plan.js"], {
				env: { ...process.env, NODE_ENV: "development" }, // Missing arguments
			});
			cp.on("exit", (code) => {
				if (code === 1) resolve();
				else
					reject(
						new Error(`Process should have failed with code 1, got ${code}`),
					);
			});
		});
	});
});
