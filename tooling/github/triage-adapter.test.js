import assert from "node:assert";
import { mock, test } from "node:test";
import { syncTriageData } from "./triage-adapter.js";

test("Triage Adapter (Sync)", async (t) => {
	// Mocks
	const mockAddLabels = mock.fn();
	const mockOctokit = {
		rest: {
			issues: {
				addLabels: mockAddLabels,
			},
		},
	};
	const mockGetIssueNodeId = mock.fn(async () => "node-123");
	const mockAddIssueToProject = mock.fn(async () => "item-456");
	const mockUpdateProjectField = mock.fn();
	const mockTrackUsage = mock.fn(async () => ({ totalCost: 0.001 }));

	const deps = {
		getOctokit: () => mockOctokit,
		getIssueNodeId: mockGetIssueNodeId,
		addIssueToProject: mockAddIssueToProject,
		updateProjectField: mockUpdateProjectField,
		trackUsage: mockTrackUsage,
		env: { NODE_ENV: "test" },
		octokit: mockOctokit,
	};

	t.beforeEach(() => {
		mockAddLabels.mock.resetCalls();
		mockGetIssueNodeId.mock.resetCalls();
		mockAddIssueToProject.mock.resetCalls();
		mockUpdateProjectField.mock.resetCalls();
		mockTrackUsage.mock.resetCalls();
		mock.method(console, "log", () => {});
		mock.method(console, "error", () => {});
	});

	t.afterEach(() => {
		mock.restoreAll();
	});

	await t.test("should process full data correctly", async () => {
		const input = JSON.stringify({
			issue_number: 123,
			model: "pro",
			priority: "P1",
			labels: ["bug"],
			usage: {
				model: "flash",
				inputTokens: 100,
				outputTokens: 50,
			},
		});

		await syncTriageData(input, deps);

		assert.strictEqual(mockGetIssueNodeId.mock.callCount(), 1);
		assert.strictEqual(mockAddIssueToProject.mock.callCount(), 1);
		// Status, Priority, Model, Cost
		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 4);
		assert.strictEqual(mockAddLabels.mock.callCount(), 1);
		assert.strictEqual(mockTrackUsage.mock.callCount(), 1);
	});

	await t.test("should handle missing optional data", async () => {
		const input = JSON.stringify({
			issue_number: 123,
		});

		await syncTriageData(input, deps);

		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1); // Only status
		assert.strictEqual(mockAddLabels.mock.callCount(), 0);
	});

	await t.test(
		"should use environment issue number if missing in JSON",
		async () => {
			const input = JSON.stringify({});
			const customDeps = {
				...deps,
				env: { NODE_ENV: "test", GITHUB_ISSUE_NUMBER: "999" },
			};

			await syncTriageData(input, customDeps);

			assert.strictEqual(
				mockGetIssueNodeId.mock.calls[0].arguments[1].issueNumber,
				999,
			);
		},
	);

	await t.test("should fail if no input provided", async () => {
		const errorSpy = mock.method(console, "error", () => {});
		await syncTriageData("", deps);
		assert.ok(
			errorSpy.mock.calls.some((c) =>
				c.arguments[0].includes("No JSON input provided"),
			),
		);
	});

	await t.test("should fail if invalid JSON", async () => {
		const errorSpy = mock.method(console, "error", () => {});
		await syncTriageData("invalid", deps);
		assert.ok(
			errorSpy.mock.calls.some((c) =>
				c.arguments[0].includes("Invalid JSON input"),
			),
		);
	});

	await t.test("should fail if issue_number missing", async () => {
		const errorSpy = mock.method(console, "error", () => {});
		await syncTriageData("{}", deps);
		assert.ok(
			errorSpy.mock.calls.some((c) =>
				c.arguments[0].includes("issue_number not provided"),
			),
		);
	});
});
