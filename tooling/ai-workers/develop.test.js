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
});

test("Development Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
