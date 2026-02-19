import assert from "node:assert";
import { mock, test } from "node:test";
import { handleFatalError, runDevelopmentAgent } from "./develop.js";

test("Development Agent", async (t) => {
	const mockRunGeminiCLI = mock.fn();
	const mockWriteGitHubOutput = mock.fn();
	const mockGetOctokit = mock.fn();
	const mockGetIssue = mock.fn();

	const deps = {
		runGeminiCLI: mockRunGeminiCLI,
		writeGitHubOutput: mockWriteGitHubOutput,
		getOctokit: mockGetOctokit,
		getIssue: mockGetIssue,
		OWNER: "test-owner",
		REPO: "test-repo",
		env: {
			ISSUE_NUMBER: "123",
			ISSUE_TITLE: "Test Issue",
			ISSUE_BODY: "Test Body",
			METHODOLOGY: "Test Methodology",
			FILES: "file1.js",
			NODE_ENV: "test",
		},
	};

	t.beforeEach(() => {
		mockRunGeminiCLI.mock.resetCalls();
		mockWriteGitHubOutput.mock.resetCalls();
		mockGetOctokit.mock.resetCalls();
		mockGetIssue.mock.resetCalls();
		mock.method(console, "log", () => {});
		mock.method(console, "error", () => {});
	});

	t.afterEach(() => {
		mock.restoreAll();
	});

	await t.test("should execute development task", async () => {
		mockRunGeminiCLI.mock.mockImplementationOnce(async () => ({
			inputTokens: 200,
			outputTokens: 100,
		}));

		await runDevelopmentAgent(deps);

		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 1);
		const prompt = mockRunGeminiCLI.mock.calls[0].arguments[0];
		assert.match(prompt, /VALIDATE IT/);
	});

	await t.test("should auto-fetch issue details if missing", async () => {
		const incompleteDeps = {
			...deps,
			env: { ...deps.env, ISSUE_TITLE: undefined, ISSUE_BODY: undefined },
		};
		mockGetIssue.mock.mockImplementationOnce(async () => ({
			title: "Fetched",
			body: "Body",
		}));
		mockRunGeminiCLI.mock.mockImplementationOnce(async () => ({
			inputTokens: 1,
			outputTokens: 1,
		}));

		await runDevelopmentAgent(incompleteDeps);

		assert.strictEqual(mockGetIssue.mock.callCount(), 1);
		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 1);
	});

	await t.test("should handle fetch error gracefully", async () => {
		const incompleteDeps = {
			...deps,
			env: { ...deps.env, ISSUE_TITLE: undefined, ISSUE_BODY: undefined },
		};
		mockGetIssue.mock.mockImplementationOnce(() => {
			throw new Error("Fail");
		});

		await runDevelopmentAgent(incompleteDeps);
		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 0);
	});

	await t.test("should handle Gemini error gracefully", async () => {
		mockRunGeminiCLI.mock.mockImplementationOnce(() => {
			throw new Error("Gemini failed");
		});
		await runDevelopmentAgent(deps);
		// Should not throw
	});

	await t.test("should exit if ISSUE_NUMBER is missing", async () => {
		const noIssueDeps = {
			...deps,
			env: { ...deps.env, ISSUE_NUMBER: undefined },
		};
		await runDevelopmentAgent(noIssueDeps);
		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 0);
	});
});

test("Development Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
