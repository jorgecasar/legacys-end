import assert from "node:assert";
import { describe, it, mock } from "node:test";

process.env.NODE_ENV = "test";
process.env.GH_TOKEN = "mock-token";

let mockPlanResponse = {
	methodology: "TDD",
	slug: "test-feature",
	files_to_touch: ["src/logic.js"],
	needs_decomposition: false,
	sub_tasks: [],
};

// Mock the gemini module
mock.module("../gemini/run-cli.js", {
	namedExports: {
		runGeminiCLI: async () => ({
			response: JSON.stringify(mockPlanResponse),
			inputTokens: 100,
			outputTokens: 50,
			modelUsed: "gemini-2.5-flash-lite",
		}),
	},
});

// Mock child_process
mock.module("node:child_process", {
	namedExports: {
		execSync: mock.fn(() => Buffer.from("")),
	},
});

// Mock the GitHub module
mock.module("../github/index.js", {
	namedExports: {
		getOctokit: () => ({
			rest: {
				issues: {
					create: async () => ({
						data: { number: 101, title: "Subtask", node_id: "MOCKED_NODE_ID" },
					}),
					get: async () => ({ data: { node_id: "ISSUE_NODE_ID" } }),
					listComments: async () => ({ data: [] }),
					update: async () => ({ data: {} }), // Added update
				},
				repos: {
					listBranches: async () => ({ data: [] }),
				},
			},
			graphql: async () => ({}),
		}),
		hasOpenSubtasks: async () => 0,
		getIssueNodeId: async () => "ISSUE_NODE_ID",
		addIssueToProject: async () => "PROJECT_ITEM_ID",
		updateProjectField: async () => ({}),
		createSubIssue: async () => ({}), // Added createSubIssue
	},
});

const mockWriteGitHubOutput = mock.fn();

mock.module("../config/index.js", {
	namedExports: {
		OWNER: "test-owner",
		REPO: "test-repo",
		FIELD_IDS: { status: "fid", model: "mid", priority: "pid" },
		OPTION_IDS: { status: { paused: "paused-id" }, priority: { p1: "p1-id" } },
		writeGitHubOutput: mockWriteGitHubOutput,
	},
});

// Now import createTechnicalPlan
const { createTechnicalPlan } = await import("./plan.js");

describe("ai-worker-plan", () => {
	it("should output branch name for workflow checkout", async () => {
		mockPlanResponse = {
			methodology: "Simple Fix",
			slug: "simple-fix",
			files_to_touch: ["readme.md"],
			needs_decomposition: false,
			sub_tasks: [],
		};

		mockWriteGitHubOutput.mock.resetCalls();

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Simple Issue",
			body: "Fix this.",
			currentBranch: "main",
		});

		// Verify branch_name output
		const branchCall = mockWriteGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.ok(branchCall, "Should output branch_name");
		assert.strictEqual(branchCall.arguments[1], "task/issue-1-simple-fix");
	});

	it("should respect existing branch if passed in environment", async () => {
		mockPlanResponse = {
			methodology: "Continue work",
			slug: "ignored-slug",
			files_to_touch: ["src/logic.js"],
			needs_decomposition: false,
			sub_tasks: [],
		};

		mockWriteGitHubOutput.mock.resetCalls();

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Simple Issue",
			body: "Fix this.",
			currentBranch: "task/issue-1-existing-work",
		});

		// Verify branch_name output echoes the current branch
		const branchCall = mockWriteGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.ok(branchCall, "Should output branch_name");
		assert.strictEqual(branchCall.arguments[1], "task/issue-1-existing-work");
	});

	it("should skip branch output if needs_decomposition is true", async () => {
		mockPlanResponse = {
			methodology: "Complex Architecture",
			slug: "complex-feature",
			files_to_touch: [],
			needs_decomposition: true,
			sub_tasks: [{ title: "Subtask 1", goal: "Goal 1", dependencies: [] }],
		};

		mockWriteGitHubOutput.mock.resetCalls();

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Complex Issue",
			body: "Decompose this.",
		});

		const branchCall = mockWriteGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.strictEqual(
			branchCall,
			undefined,
			"Should NOT output branch_name for decomposition",
		);
	});

	it("should handle decomposition with dependencies", async () => {
		mockPlanResponse = {
			methodology: "Complex Refactor",
			slug: "complex-refactor",
			files_to_touch: ["src/a.js", "src/b.js"],
			needs_decomposition: true,
			sub_tasks: [
				{ title: "Task 1", goal: "Goal 1", dependencies: [] },
				{ title: "Task 2", goal: "Goal 2", dependencies: [1] },
			],
		};

		mockWriteGitHubOutput.mock.resetCalls();
		const consoleLogMock = mock.method(console, "log", () => {});

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Big Task",
			body: "Do a lot of things.",
		});

		assert.strictEqual(
			mockWriteGitHubOutput.mock.calls.find(
				(c) => c.arguments[0] === "needs_decomposition",
			)?.arguments[1],
			"true",
		);

		consoleLogMock.mock.restore();
	});

	it("should detect if issue is already a subtask", async () => {
		mockPlanResponse = {
			methodology: "Small task",
			slug: "small",
			files_to_touch: ["src/c.js"],
			needs_decomposition: false,
		};

		mockWriteGitHubOutput.mock.resetCalls();
		const consoleLogMock = mock.method(console, "log", () => {});

		await createTechnicalPlan({
			issueNumber: 101,
			title: "Subtask title",
			body: "Parent issue: #1",
		});

		assert.ok(
			consoleLogMock.mock.calls.some((c) =>
				c.arguments[0].includes("identified as a sub-task"),
			),
		);

		consoleLogMock.mock.restore();
	});

	it("should return early if missing input", async () => {
		process.env.NODE_ENV = "test";
		const consoleErrorMock = mock.method(console, "error", () => {});
		await createTechnicalPlan({
			issueNumber: undefined,
			title: undefined,
			body: undefined,
		});
		assert.ok(consoleErrorMock.mock.calls.length > 0);
		consoleErrorMock.mock.restore();
	});
});
