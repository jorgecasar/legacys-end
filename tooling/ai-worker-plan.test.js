import assert from "node:assert";
import { spawn } from "node:child_process";
import { before, describe, it, mock } from "node:test";

// Mock the gemini-with-fallback module before importing main
mock.module("./gemini-with-fallback.js", {
	namedExports: {
		runWithFallback: async () => ({
			data: {
				methodology: "TDD",
				slug: "test-feature",
				files_to_touch: ["src/logic.js"],
				needs_decomposition: false,
				sub_tasks: [],
			},
			inputTokens: 100,
			outputTokens: 50,
			modelUsed: "gemini-2.5-flash-lite",
		}),
	},
});

// Now import main
let main;
try {
	const module = await import("./ai-worker-plan.js");
	main = module.main;
} catch (e) {
	console.error("IMPORT ERROR:", e);
	process.exit(1);
}

describe("ai-worker-plan", () => {
	mock.method(console, "log", () => {});
	mock.method(console, "error", () => {});

	it("should create a branch and planning complete", async () => {
		const exec = mock.fn((_cmd) => Buffer.from(""));
		await main({
			issueNumber: "10",
			title: "Test Title",
			body: "Test Body",
			exec,
		});

		// Verify git commands were called
		const calls = exec.mock.calls.map((c) => c.arguments[0]);
		assert.ok(
			calls.some((c) =>
				c.includes("git checkout -b task/issue-10-test-feature"),
			),
		);
	});

	it("should return early if missing input", async () => {
		process.env.NODE_ENV = "test";
		// Should not throw, just return early after logging error
		await main({ issueNumber: undefined });
	});
});
