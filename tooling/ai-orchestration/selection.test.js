import assert from "node:assert";
import { mock, test } from "node:test";
import {
	findLeafCandidates,
	handleFatalError,
	orchestrateExecution,
} from "./selection.js";

test("Selection Agent (Orchestrator)", async (t) => {
	// Mocks
	const mockGetOctokit = mock.fn();
	const mockFetchProjectItems = mock.fn();
	const mockGetIssueNodeId = mock.fn();
	const mockAddIssueToProject = mock.fn();
	const mockUpdateProjectField = mock.fn();
	const mockRunGeminiCLI = mock.fn();
	const mockExecSync = mock.fn();

	const deps = {
		getOctokit: mockGetOctokit,
		fetchProjectItems: mockFetchProjectItems,
		getIssueNodeId: mockGetIssueNodeId,
		addIssueToProject: mockAddIssueToProject,
		updateProjectField: mockUpdateProjectField,
		runGeminiCLI: mockRunGeminiCLI,
		execSync: mockExecSync,
		OWNER: "test",
		REPO: "test",
		FIELD_IDS: { status: "status_id" },
		OPTION_IDS: { status: { inProgress: "inprogress_id" } },
	};

	t.beforeEach(() => {
		mockFetchProjectItems.mock.resetCalls();
		mockRunGeminiCLI.mock.resetCalls();
		mockUpdateProjectField.mock.resetCalls();
		mockExecSync.mock.resetCalls();
		mockGetIssueNodeId.mock.resetCalls();
		mockAddIssueToProject.mock.resetCalls();
	});

	await t.test("findLeafCandidates should find leaf nodes recursively", () => {
		const items = [
			{ number: 1, status: "Todo", subIssues: [{ number: 2, state: "OPEN" }] },
			{ number: 2, status: "Todo", subIssues: [] }, // Leaf
			{ number: 3, status: "Todo", subIssues: [] }, // Leaf
			{ number: 4, status: "Done" }, // Ignored
			{ number: 5, state: "CLOSED" }, // Ignored
		];

		const leaves = findLeafCandidates(
			[items[0], items[2], items[3], items[4]],
			items,
		);
		assert.strictEqual(leaves.length, 2);
		assert.ok(leaves.find((l) => l.number === 2));
		assert.ok(leaves.find((l) => l.number === 3));
	});

	await t.test("should orchestrate selection and dispatch worker", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{
				number: 10,
				status: "Todo",
				title: "Task 1",
				id: "item-10",
				subIssues: [],
			},
		]);

		mockRunGeminiCLI.mock.mockImplementation(async () => ({
			selected_issue_number: 10,
			reason: "High priority",
		}));

		await orchestrateExecution(deps);

		// Check if status was updated
		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
		const updateArgs = mockUpdateProjectField.mock.calls[0].arguments;
		assert.strictEqual(updateArgs[1], "item-10"); // itemId
		assert.strictEqual(updateArgs[3], "inprogress_id");

		// Check if worker was dispatched
		assert.strictEqual(mockExecSync.mock.callCount(), 1);
		const execCmd = mockExecSync.mock.calls[0].arguments[0];
		assert.match(execCmd, /gh workflow run ai-worker.yml/);
		assert.match(execCmd, /issue_number=10/);
	});

	await t.test("should handle no candidates gracefully", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => []);
		const mockConsoleLog = mock.method(console, "log", () => {});

		await orchestrateExecution(deps);

		assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 0);

		mockConsoleLog.mock.restore();
	});

	await t.test(
		"should handle candidates but no leaves gracefully",
		async () => {
			// e.g., All Todo items are Done/Closed or filtered out
			mockFetchProjectItems.mock.mockImplementation(async () => [
				{ number: 1, status: "Todo", state: "CLOSED", subIssues: [] }, // Invalid leaf
			]);
			const mockConsoleLog = mock.method(console, "log", () => {});

			await orchestrateExecution(deps);

			assert.strictEqual(mockRunGeminiCLI.mock.callCount(), 0); // No valid leaves

			mockConsoleLog.mock.restore();
		},
	);

	await t.test("should handle invalid AI selection", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{
				number: 10,
				status: "Todo",
				title: "Task 1",
				id: "item-10",
				subIssues: [],
			},
		]);

		// AI selects non-existent ID
		mockRunGeminiCLI.mock.mockImplementation(async () => ({
			selected_issue_number: 999,
			reason: "Hallucination",
		}));

		const mockConsoleError = mock.method(console, "error", () => {});

		await orchestrateExecution(deps);

		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 0); // Should not proceed

		mockConsoleError.mock.restore();
	});

	await t.test("should add to project if item ID is missing", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{ number: 10, status: "Todo", title: "Task 1", id: null, subIssues: [] }, // No ID
		]);

		mockRunGeminiCLI.mock.mockImplementation(async () => ({
			selected_issue_number: 10,
			reason: "Priority",
		}));

		mockGetIssueNodeId.mock.mockImplementation(async () => "node-10");
		mockAddIssueToProject.mock.mockImplementation(async () => "new-item-10");

		await orchestrateExecution(deps);

		assert.strictEqual(mockAddIssueToProject.mock.callCount(), 1);
		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
		const updateArgs = mockUpdateProjectField.mock.calls[0].arguments;
		assert.strictEqual(updateArgs[1], "new-item-10");
	});

	await t.test("should handle action failures gracefully", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{
				number: 10,
				status: "Todo",
				title: "Task 1",
				id: "item-10",
				subIssues: [],
			},
		]);
		mockRunGeminiCLI.mock.mockImplementation(async () => ({
			selected_issue_number: 10,
		}));

		// Fail update
		mockUpdateProjectField.mock.mockImplementation(async () => {
			throw new Error("Update failed");
		});
		const mockConsoleError = mock.method(console, "error", () => {});

		await orchestrateExecution(deps);

		assert.match(mockConsoleError.mock.calls[0].arguments[0], /Action Failed/);

		mockConsoleError.mock.restore();
	});
});

test("Selection Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);
	assert.strictEqual(mockExit.mock.calls[0].arguments[0], 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
