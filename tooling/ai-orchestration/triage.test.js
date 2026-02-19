import assert from "node:assert";
import { mock, test } from "node:test";
import { handleFatalError, runTriage } from "./triage.js";

test("Triage Agent", async (t) => {
	// Mocks
	const mockGetOctokit = mock.fn();
	const mockFetchProjectItems = mock.fn();
	const mockRunGeminiCLI = mock.fn();
	const mockSyncTriageData = mock.fn();

	const deps = {
		getOctokit: mockGetOctokit,
		fetchProjectItems: mockFetchProjectItems,
		runGeminiCLI: mockRunGeminiCLI,
		syncTriageData: mockSyncTriageData,
		env: { ISSUE_NUMBER: undefined }, // Default to full mode
		argv: [],
	};

	t.beforeEach(() => {
		mockFetchProjectItems.mock.resetCalls();
		mockRunGeminiCLI.mock.resetCalls();
		mockSyncTriageData.mock.resetCalls();

		// Silence console logs
		mock.method(console, "log", () => {});
		mock.method(console, "error", () => {});
	});

	t.afterEach(() => {
		mock.restoreAll();
	});

	await t.test(
		"should process tasks without ai-triaged label in full mode",
		async () => {
			mockFetchProjectItems.mock.mockImplementation(async () => [
				{ number: 1, title: "Untriaged Task", labels: [], body: "Body" },
				{
					number: 2,
					title: "Triaged Task",
					labels: ["ai-triaged"],
					body: "Body",
				},
			]);

			mockRunGeminiCLI.mock.mockImplementation(async () => ({
				response: JSON.stringify({
					1: {
						priority: "P1",
						labels: ["task"],
						model: "flash",
						reason: "test",
					},
				}),
				modelUsed: "flash",
				inputTokens: 100,
				outputTokens: 50,
			}));

			await runTriage(deps);

			// Should call Gemini only for task #1
			assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 1);
			const prompt = mockRunGeminiCLI.mock.calls[0].arguments[0];
			assert.match(prompt, /Untriaged Task/);
			assert.doesNotMatch(prompt, /Triaged Task/);

			// Should sync
			assert.strictEqual(mockSyncTriageData.mock.callCount(), 1);
		},
	);

	await t.test("should skip processing if all tasks are triaged", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{ number: 1, labels: ["ai-triaged"] },
		]);
		// Spy to check call content (re-mocking since global mock is generic)
		const logSpy = mock.method(console, "log", () => {});

		await runTriage(deps);

		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 0);
		assert.match(
			logSpy.mock.calls.find((c) => c.arguments[0].includes("Skipped"))
				?.arguments[0] || "",
			/Skipped 1 task/,
		);
	});

	await t.test(
		"should force triage for specific issue even if labeled",
		async () => {
			const specificDeps = { ...deps, env: { ISSUE_NUMBER: "1" } };

			mockFetchProjectItems.mock.mockImplementation(async () => [
				{ number: 1, title: "Triaged Task", labels: ["ai-triaged"] },
			]);

			mockRunGeminiCLI.mock.mockImplementation(async () => ({
				response: "{}",
			}));

			await runTriage(specificDeps);

			assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 1); // Should NOT skip
		},
	);

	await t.test("should handle Gemini errors", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{ number: 1, labels: [] },
		]);
		mockRunGeminiCLI.mock.mockImplementation(async () => {
			throw new Error("Gemini Error");
		});
		const errorSpy = mock.method(console, "error", () => {});

		await runTriage(deps);

		assert.strictEqual(errorSpy.mock.callCount(), 1);
	});
});

test("Triage Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
