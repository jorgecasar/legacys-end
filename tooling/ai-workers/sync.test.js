import assert from "node:assert";
import { mock, test } from "node:test";
import { handleFatalError, sync } from "./sync.js";

test("Sync Agent", async (t) => {
	const mockGetOctokit = mock.fn();
	const mockFetchProjectItems = mock.fn();
	const mockUpdateProjectField = mock.fn();
	const mockGetIssueNodeId = mock.fn();
	const mockAddIssueToProject = mock.fn();
	const mockAddIssueComment = mock.fn();
	const mockListComments = mock.fn();
	const mockUpdateComment = mock.fn();
	const mockCalculateCost = mock.fn();

	const mockOctokit = {
		rest: {
			issues: {
				listComments: mockListComments,
				createComment: mockAddIssueComment,
				updateComment: mockUpdateComment,
			},
		},
	};

	mockGetOctokit.mock.mockImplementation(() => mockOctokit);
	mockCalculateCost.mock.mockImplementation(() => ({
		totalCost: 0.1,
		model: "flash",
	}));

	const deps = {
		getOctokit: mockGetOctokit,
		fetchProjectItems: mockFetchProjectItems,
		updateProjectField: mockUpdateProjectField,
		getIssueNodeId: mockGetIssueNodeId,
		addIssueToProject: mockAddIssueToProject,
		addIssueComment: mockAddIssueComment,
		calculateCost: mockCalculateCost,
		FIELD_IDS: { status: "s", cost: "c", model: "m" },
		OPTION_IDS: { status: { paused: "p" } },
		OWNER: "test-owner",
		REPO: "test-repo",
		env: {
			ISSUE_NUMBER: "123",
			PLANNING_INPUT_TOKENS: "100",
			PLANNING_OUTPUT_TOKENS: "50",
			NODE_ENV: "test",
		},
	};

	t.beforeEach(() => {
		mockFetchProjectItems.mock.mockImplementation(async () => [
			{ number: 123, id: "item-123" },
		]);
		mockListComments.mock.mockImplementation(async () => ({ data: [] }));
		mockGetIssueNodeId.mock.resetCalls();
		mockAddIssueToProject.mock.resetCalls();
		mockUpdateProjectField.mock.resetCalls();
		mockAddIssueComment.mock.resetCalls();
		mockUpdateComment.mock.resetCalls();
	});

	await t.test("should sync planning costs and create new report", async () => {
		await sync(deps);

		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
		assert.strictEqual(mockAddIssueComment.mock.callCount(), 1);
		const body = mockAddIssueComment.mock.calls[0].arguments[1].body;
		assert.match(body, /Planning/);
	});

	await t.test("should update existing report", async () => {
		mockListComments.mock.mockImplementation(async () => ({
			data: [
				{
					id: 999,
					body: "### 🤖 AI Cost Report\n| 2023-01-01 | Triage | gemini | 10 | 10 | $0.001 |\n",
				},
			],
		}));

		await sync(deps);

		assert.strictEqual(mockUpdateComment.mock.callCount(), 1);
		const body = mockUpdateComment.mock.calls[0].arguments[0].body;
		assert.match(body, /Triage/);
		assert.match(body, /Planning/);
	});

	await t.test("should add issue to project if missing", async () => {
		mockFetchProjectItems.mock.mockImplementation(async () => []);
		mockGetIssueNodeId.mock.mockImplementation(async () => "node-123");
		mockAddIssueToProject.mock.mockImplementation(async () => "new-item-123");

		await sync(deps);

		assert.strictEqual(mockAddIssueToProject.mock.callCount(), 1);
		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
		// Verify update uses new item ID
		assert.strictEqual(
			mockUpdateProjectField.mock.calls[0].arguments[1],
			"new-item-123",
		);
	});

	await t.test("should handle failed tasks", async () => {
		// We need to inject argv handling or mock process.argv globally
		const originalArgv = process.argv;
		process.argv = [...originalArgv, "--failed"];

		await sync(deps);

		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
		const args = mockUpdateProjectField.mock.calls[0].arguments;
		assert.strictEqual(args[2], "s"); // FIELD_ID.status
		assert.strictEqual(args[3], "p"); // OPTION_ID.paused

		assert.strictEqual(mockAddIssueComment.mock.callCount(), 1);
		assert.match(
			mockAddIssueComment.mock.calls[0].arguments[1].body,
			/Task Paused/,
		);

		// Restore argv
		process.argv = originalArgv;
	});

	await t.test("should exit if ISSUE_NUMBER missing", async () => {
		const exitMock = mock.method(process, "exit", () => {});
		const consoleMock = mock.method(console, "error", () => {});

		await sync({
			...deps,
			env: { ...deps.env, ISSUE_NUMBER: undefined, NODE_ENV: "production" },
		});

		assert.strictEqual(exitMock.mock.callCount(), 1);

		exitMock.mock.restore();
		consoleMock.mock.restore();
	});
});

test("Sync Agent Fatal Error Handler", () => {
	const mockExit = mock.method(process, "exit", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});

	handleFatalError(new Error("Fatal"));

	assert.strictEqual(mockExit.mock.callCount(), 1);
	assert.strictEqual(mockExit.mock.calls[0].arguments[0], 1);

	mockExit.mock.restore();
	mockConsoleError.mock.restore();
});
