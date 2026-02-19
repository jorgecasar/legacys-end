import assert from "node:assert";
import { describe, it, mock } from "node:test";
import { createTechnicalPlan } from "./plan.js";

process.env.NODE_ENV = "test";
process.env.GH_TOKEN = "mock-token";

describe("ai-worker-plan", () => {
	// Common mocks factory
	const createMockDeps = () => {
		const mockOctokit = {
			rest: {
				issues: {
					create: mock.fn(async () => ({
						data: { number: 101, title: "Subtask", node_id: "MOCKED_NODE_ID" },
					})),
					get: mock.fn(async () => ({ data: { node_id: "ISSUE_NODE_ID" } })),
					listComments: mock.fn(async () => ({ data: [] })),
					update: mock.fn(async () => ({ data: {} })),
				},
				repos: {
					listBranches: async () => ({ data: [] }),
				},
			},
			graphql: async () => ({}),
			request: mock.fn(async () => ({})),
		};

		return {
			mockOctokit,
			deps: {
				getOctokit: mock.fn(() => mockOctokit),
				runGeminiCLI: mock.fn(async () => ({
					methodology: "TDD",
					slug: "test-feature",
					files_to_touch: ["src/logic.js"],
					needs_decomposition: false,
					sub_tasks: [],
					inputTokens: 100,
					outputTokens: 50,
					modelUsed: "gemini-2.5-flash-lite",
				})),
				writeGitHubOutput: mock.fn(),
				hasOpenSubtasks: mock.fn(async () => 0),
				getIssueNodeId: mock.fn(async () => "ISSUE_NODE_ID"),
				addIssueToProject: mock.fn(async () => "PROJECT_ITEM_ID"),
				updateProjectField: mock.fn(async () => ({})),
				createSubIssue: mock.fn(async () => ({})),
			},
		};
	};

	it("should output branch name for workflow checkout", async () => {
		const { deps, mockOctokit } = createMockDeps();

		deps.runGeminiCLI.mock.mockImplementation(async () => ({
			methodology: "Simple Fix",
			slug: "simple-fix",
			files_to_touch: ["readme.md"],
			needs_decomposition: false,
			inputTokens: 10,
			outputTokens: 10,
		}));

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Simple Issue",
			body: "Fix this.",
			currentBranch: "main",
			deps,
		});

		const branchCall = deps.writeGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.ok(branchCall, "Should output branch_name");
		assert.strictEqual(branchCall.arguments[1], "task/issue-1-simple-fix");
	});

	it("should respect existing branch if passed in environment", async () => {
		const { deps } = createMockDeps();

		deps.runGeminiCLI.mock.mockImplementation(async () => ({
			methodology: "Continue",
			slug: "ignored",
			needs_decomposition: false,
			inputTokens: 10,
			outputTokens: 10,
		}));

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Simple Issue",
			body: "Fix this.",
			currentBranch: "task/issue-1-existing-work",
			deps,
		});

		const branchCall = deps.writeGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.strictEqual(branchCall.arguments[1], "task/issue-1-existing-work");
	});

	it("should skip branch output if needs_decomposition is true", async () => {
		const { deps } = createMockDeps();

		deps.runGeminiCLI.mock.mockImplementation(async () => ({
			methodology: "Complex",
			slug: "complex",
			needs_decomposition: true,
			sub_tasks: [{ title: "T1", goal: "G1" }],
			inputTokens: 10,
			outputTokens: 10,
		}));

		await createTechnicalPlan({
			issueNumber: 1,
			title: "Complex Issue",
			body: "Decompose this.",
			deps,
		});

		const branchCall = deps.writeGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.strictEqual(
			branchCall,
			undefined,
			"Should NOT output branch_name for decomposition",
		);
	});

	it("should detect if issue is already a subtask", async () => {
		const { deps } = createMockDeps();

		deps.runGeminiCLI.mock.mockImplementation(async () => ({
			methodology: "Small",
			slug: "small",
			needs_decomposition: false,
			inputTokens: 10,
			outputTokens: 10,
		}));

		const consoleLogMock = mock.method(console, "log", () => {});
		await createTechnicalPlan({
			issueNumber: 101,
			title: "Subtask title",
			body: "Parent issue: #1",
			deps,
		});
		assert.ok(
			consoleLogMock.mock.calls.some((c) =>
				c.arguments[0].includes("identified as a sub-task"),
			),
		);
		consoleLogMock.mock.restore();
	});

	it("should coerce issueNumber to integer for hasOpenSubtasks", async () => {
		const { deps } = createMockDeps();
		const consoleLogMock = mock.method(console, "log", () => {});

		await createTechnicalPlan({
			issueNumber: "999", // String input
			title: "Type Check",
			body: "Checking types",
			deps,
		});

		const calls = deps.hasOpenSubtasks.mock.calls;
		assert.strictEqual(
			calls.length,
			1,
			"hasOpenSubtasks should be called once",
		);
		const args = calls[0].arguments[1]; // second arg is params object
		assert.strictEqual(
			typeof args.issueNumber,
			"number",
			"issueNumber should be a number",
		);
		assert.strictEqual(args.issueNumber, 999, "issueNumber should be 999");

		consoleLogMock.mock.restore();
	});

	it("should skip planning when existing plan comment found", async () => {
		const { deps, mockOctokit } = createMockDeps();

		// Mock comments to include an existing plan
		mockOctokit.rest.issues.listComments.mock.mockImplementation(async () => ({
			data: [
				{
					id: 42,
					user: { login: "bot" },
					body: `<!-- AI-PLAN -->\n## 🗺️ AI Plan\n**Methodology:** Cached TDD\n**Branch:** \`task/issue-5-cached\`\n**Files:** src/a.js, src/b.js\n**Decomposition:** No`,
				},
			],
		}));

		const consoleLogMock = mock.method(console, "log", () => {});
		await createTechnicalPlan({
			issueNumber: 5,
			title: "Cached Issue",
			body: "Already planned.",
			deps,
		});

		// Should NOT call runGeminiCLI
		assert.strictEqual(
			deps.runGeminiCLI.mock.callCount(),
			0,
			"Should skip LLM call",
		);

		// Should output cached values
		const methodologyCall = deps.writeGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "methodology",
		);
		assert.ok(methodologyCall, "Should output methodology");
		assert.strictEqual(methodologyCall.arguments[1], "Cached TDD");

		const branchCall = deps.writeGitHubOutput.mock.calls.find(
			(c) => c.arguments[0] === "branch_name",
		);
		assert.ok(branchCall, "Should output branch_name");
		assert.strictEqual(branchCall.arguments[1], "task/issue-5-cached");

		consoleLogMock.mock.restore();
	});

	it("should post plan comment after successful planning", async () => {
		const { deps, mockOctokit } = createMockDeps();

		deps.runGeminiCLI.mock.mockImplementation(async () => ({
			methodology: "TDD",
			slug: "new-feature",
			files_to_touch: ["src/new.js"],
			needs_decomposition: false,
			inputTokens: 10,
			outputTokens: 10,
		}));

		deps.addIssueComment = mock.fn(async () => ({}));

		const consoleLogMock = mock.method(console, "log", () => {});
		await createTechnicalPlan({
			issueNumber: 7,
			title: "New Feature",
			body: "Implement this.",
			deps,
		});

		assert.strictEqual(
			deps.addIssueComment.mock.callCount(),
			1,
			"Should post plan comment",
		);
		const commentBody = deps.addIssueComment.mock.calls[0].arguments[1].body;
		assert.ok(
			commentBody.startsWith("<!-- AI-PLAN -->"),
			"Comment should start with marker",
		);
		assert.match(commentBody, /TDD/);

		consoleLogMock.mock.restore();
	});
});
