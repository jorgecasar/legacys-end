import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";

// Set environment to test
process.env.NODE_ENV = "test";
process.env.GH_TOKEN = "fake-token";
process.env.GITHUB_OUTPUT = "fake-output-path";

// 1. Mock Gemini Fallback
let mockGeminiResult = {};
mock.module("./gemini-with-fallback.js", {
	namedExports: {
		runWithFallback: async (type, prompt, options) => {
			if (typeof mockGeminiResult === "function") {
				return mockGeminiResult(type, prompt, options);
			}
			return mockGeminiResult;
		},
	},
});

// 2. Mock Triage Sync and Worker Sync (avoid API calls)
mock.module("./ai-triage-sync.js", {
	namedExports: {
		syncTriageData: async () => ({ success: true }),
	},
});

mock.module("./ai-worker-sync.js", {
	namedExports: {
		syncWorkerResults: async () => ({ success: true }),
	},
});

// Mock Octokit more robustly
mock.module("@octokit/rest", {
	namedExports: {
		Octokit: class {
			constructor() {
				this.rest = {
					issues: {
						get: async () => ({
							data: {
								number: 8,
								title: "Mock Issue",
								body: "Mock Body",
								node_id: "MOCK_NODE_ID",
							},
						}),
						listComments: async () => ({ data: [] }),
						createComment: async () => ({ data: { id: 123 } }),
						updateComment: async () => ({ data: { id: 123 } }),
					},
				};
				this.graphql = async () => ({
					node: { items: { nodes: [] } },
					addProjectV2ItemById: { item: { id: "ITEM_ID" } },
				});
			}
		},
	},
});

// Mock fs globally
import fs from "node:fs";

mock.method(fs, "existsSync", (p) => true);
mock.method(fs, "readFileSync", (path) => {
	if (path === ".env") return "GEMINI_API_KEY=fake-key";
	if (path.endsWith("/"))
		throw new Error("EISDIR: illegal operation on a directory, read"); // Simulation
	return "mock content";
});
mock.method(fs, "statSync", (p) => {
	return {
		isFile: () => !p.endsWith("/"),
		isDirectory: () => p.endsWith("/"),
	};
});
mock.method(fs, "mkdirSync", () => {});
mock.method(fs, "writeFileSync", () => {});
mock.method(fs, "unlinkSync", () => {});

// Mock process.exit
mock.method(process, "exit", (code) => {
	if (code !== 0) throw new Error(`Process exited with code ${code}`);
});

// 3. Mock execSync globally for the tests
const execMock = mock.fn((cmd) => {
	return "";
});

// Now we can import the modules that depend on the mocks
const { triageIssues } = await import("./gemini-triage.js");
const { createTechnicalPlan } = await import("./ai-worker-plan.js");
const { implementPlan } = await import("./ai-worker-develop.js");

describe("AI Agent Flow Integration", () => {
	beforeEach(() => {
		execMock.mock.resetCalls();
		// Reset env vars that might be set by tests
		delete process.env.ISSUE_NUMBER;
		delete process.env.ISSUE_TITLE;
		delete process.env.ISSUE_BODY;
		delete process.env.METHODOLOGY;
		delete process.env.FILES;
	});

	it("should propagate data from Triage through Planning to Development", async () => {
		// --- Step 1: Triage ---
		mockGeminiResult = (type) => {
			if (type === "flash") {
				// Triage result
				return {
					data: {
						results: [
							{
								issue_number: 8,
								model: "flash",
								priority: "P1",
								labels: ["ai-triaged"],
							},
						],
					},
					modelUsed: "gemini-2.5-flash-lite",
					inputTokens: 100,
					outputTokens: 50,
				};
			}
			return {};
		};

		process.env.GITHUB_ISSUE_NUMBER = "8";
		const triageResult = await triageIssues();
		assert.ok(
			triageResult.triageData["8"],
			"Triage data for issue 8 should exist",
		);
		assert.strictEqual(triageResult.triageData["8"].model, "flash");

		// --- Step 2: Planning ---
		// Simulate what ai-agent-flow.js does: set env vars
		process.env.ISSUE_NUMBER = "8";
		process.env.ISSUE_TITLE = "Implement Quest Data Validation";
		process.env.ISSUE_BODY = "Validation logic needed for quest system.";

		mockGeminiResult = (type) => {
			if (type === "flash") {
				return {
					data: {
						methodology: "TDD",
						slug: "quest-val",
						files_to_touch: ["src/utils/validators.js"],
						needs_decomposition: false,
						sub_tasks: [],
					},
					modelUsed: "gemini-2.5-flash-lite",
					inputTokens: 150,
					outputTokens: 75,
				};
			}
			return {};
		};

		const planResult = await createTechnicalPlan({ exec: execMock });

		// Assert environment variables that SHOULD be set by ai-agent-flow.js (or simulated here)
		// Note: when testing modules individually, we often have to simulate what the orchestrator does.
		// In a real TDD for the orchestrator, we'd test ai-agent-flow.js main(), but here we test the flow logic.
		assert.strictEqual(planResult.data.methodology, "TDD");
		assert.ok(
			planResult.data.files_to_touch.includes("src/utils/validators.js"),
		);

		// Check if exec was called to create branch
		const calls = execMock.mock.calls.map((c) => c.arguments[0]);
		assert.ok(
			calls.some((c) => c.includes("git checkout -b task/issue-8-quest-val")),
		);

		// --- Step 3: Development ---
		// Simulate the propagation logic I just added to ai-agent-flow.js
		process.env.METHODOLOGY = planResult.data.methodology;
		process.env.FILES =
			(planResult.data.files_to_touch || []).join(" ") + " src/core/ "; // Add a directory

		mockGeminiResult = (type) => {
			if (type === "pro") {
				return {
					data: {
						changes: [
							{
								path: "src/utils/validators.js",
								operation: "create",
								content: "export const validateQuest = () => true;",
							},
						],
					},
					modelUsed: "gemini-2.5-pro",
					inputTokens: 500,
					outputTokens: 200,
				};
			}
			return {};
		};

		// Mock fs methods already handled globally, but ensuring they are stubs
		// no need to re-mock here if they are already mocked globally
		const devResult = await implementPlan();
		assert.strictEqual(devResult.data.changes.length, 1);
		assert.strictEqual(
			devResult.data.changes[0].path,
			"src/utils/validators.js",
		);
		assert.strictEqual(devResult.modelUsed, "gemini-2.5-pro");
	});
});
