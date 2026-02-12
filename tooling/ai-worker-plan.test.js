import assert from "node:assert";
import { describe, it, mock } from "node:test";

process.env.NODE_ENV = "test";

let mockResult = {
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
};

// Mock the gemini-with-fallback module once at the top level
mock.module("./gemini-with-fallback.js", {
	namedExports: {
		runWithFallback: async () => mockResult,
	},
});

// Now import createTechnicalPlan
const { createTechnicalPlan } = await import("./ai-worker-plan.js");

describe("ai-worker-plan", () => {
	it("should create a branch and planning complete", async () => {
		mockResult = {
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
		};

		const exec = mock.fn((_cmd) => Buffer.from(""));
		await createTechnicalPlan({
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

	it("should throw error if plan structure is invalid", async () => {
		mockResult = {
			data: { methodology: "Test" }, // Missing slug
			inputTokens: 10,
			outputTokens: 10,
			modelUsed: "gemini-2.5-flash-lite",
		};

		const exec = mock.fn();
		const consoleErrorMock = mock.method(console, "error", () => {});

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Test",
			body: "Test Body",
			exec,
		});

		assert.ok(
			consoleErrorMock.mock.calls.some((c) =>
				c.arguments.join(" ").includes("Invalid plan structure."),
			),
		);
		consoleErrorMock.mock.restore();
	});

	it("should return early if missing input", async () => {
		process.env.NODE_ENV = "test";
		const consoleErrorMock = mock.method(console, "error", () => {});
		await createTechnicalPlan({ issueNumber: undefined });
		assert.ok(consoleErrorMock.mock.calls.length > 0);
		consoleErrorMock.mock.restore();
	});
});
