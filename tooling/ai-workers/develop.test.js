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
		assert.match(prompt, /Test Methodology/);
		assert.match(prompt, /file1\.js/);
	});

	await t.test("should exit if ISSUE_NUMBER is missing", async () => {
		const exitMock = mock.method(process, "exit", () => {});
		const consoleMock = mock.method(console, "error", () => {});

		await runDevelopmentAgent({
			...deps,
			env: { ...deps.env, ISSUE_NUMBER: undefined, NODE_ENV: "production" },
		});

		assert.strictEqual(exitMock.mock.callCount(), 1);
		assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);

		exitMock.mock.restore();
		consoleMock.mock.restore();
	});

	await t.test("should fetch issue details if missing from env", async () => {
		mockGetIssue.mock.mockImplementationOnce(async () => ({
			title: "Fetched",
			body: "Body",
		}));
		mockRunGeminiCLI.mock.mockImplementationOnce(async () => ({}));

		await runDevelopmentAgent({
			...deps,
			env: { ...deps.env, ISSUE_TITLE: undefined, ISSUE_BODY: undefined },
		});

		assert.strictEqual(mockGetIssue.mock.callCount(), 1);
		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 1);
	});

	await t.test("should exit if fetching issue details fails", async () => {
		const exitMock = mock.method(process, "exit", () => {});
		const consoleMock = mock.method(console, "error", () => {});
		mockGetIssue.mock.mockImplementationOnce(async () => {
			throw new Error("Fetch failed");
		});

		await runDevelopmentAgent({
			...deps,
			env: {
				...deps.env,
				ISSUE_TITLE: undefined,
				ISSUE_BODY: undefined,
				NODE_ENV: "production",
			},
		});

		assert.strictEqual(exitMock.mock.callCount(), 1);

		exitMock.mock.restore();
		consoleMock.mock.restore();
	});

	await t.test("should handle Gemini CLI errors", async () => {
		const exitMock = mock.method(process, "exit", () => {});
		const consoleMock = mock.method(console, "error", () => {});
		mockRunGeminiCLI.mock.mockImplementationOnce(async () => {
			throw new Error("Gemini failed");
		});

		await runDevelopmentAgent({
			...deps,
			env: { ...deps.env, NODE_ENV: "production" },
		});

		assert.strictEqual(exitMock.mock.callCount(), 1);

		exitMock.mock.restore();
		consoleMock.mock.restore();
	});
});

test("Development Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);
	assert.strictEqual(mockExit.mock.calls[0].arguments[0], 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
