import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the project's tooling modules used by the orchestrator
vi.mock("../tooling/github/index.js", () => ({
	fetchProjectItems: vi.fn(),
	getOctokit: vi.fn(),
	updateProjectField: vi.fn(),
}));

vi.mock("../tooling/config/index.js", () => ({
	FIELD_IDS: { status: "statusField" },
	OPTION_IDS: { status: { inProgress: "inProgressId" } },
	OWNER: "owner",
	REPO: "repo",
}));

describe("orchestrator selection algorithm", () => {
	beforeEach(() => {
		// Force local execution to avoid dispatching workflows
		process.env.LOCAL_EXECUTION = "true";
		// Ensure fresh module state between tests
		vi.resetModules();
	});

	afterEach(() => {
		delete process.env.LOCAL_EXECUTION;
	});

	it.skip("selects a paused leaf task and marks it In Progress", async () => {
		const github = await import("../tooling/github/index.js");
		// One paused leaf task
		github.fetchProjectItems.mockResolvedValue([
			{
				id: "I_1",
				number: 1,
				title: "paused leaf",
				status: "Paused",
				priority: "P1",
				labels: [],
				parentLabels: [],
				subIssues: [],
			},
		]);
		github.updateProjectField.mockResolvedValue();

		const mod = await import("../tooling/ai-orchestration/orchestrator.js");
		const selected = await mod.orchestrateExecution();

		expect(selected).not.toBeNull();
		expect(selected.number).toBe(1);
		// Should call updateProjectField for main tasks
		expect(github.updateProjectField).toHaveBeenCalledWith(
			expect.any(Object),
			"I_1",
			"statusField",
			"inProgressId",
		);
	});

	it.skip("selects a child of the most important paused parent when no paused leaves exist", async () => {
		const github = await import("../tooling/github/index.js");
		// One paused parent with a single open child
		github.fetchProjectItems.mockResolvedValue([
			{
				id: "I_parent",
				number: 10,
				title: "parent",
				status: "Paused",
				priority: "P0",
				labels: [],
				parentLabels: [],
				subIssues: [{ number: 42, state: "OPEN" }],
			},
		]);

		// Mock octokit to return child issue details
		github.getOctokit.mockImplementation(() => ({
			rest: {
				issues: {
					get: async () => ({
						data: { number: 42, title: "child", labels: ["P0"] },
					}),
				},
			},
		}));

		github.updateProjectField.mockResolvedValue();

		const mod = await import("../tooling/ai-orchestration/orchestrator.js");
		const selected = await mod.orchestrateExecution();

		expect(selected).not.toBeNull();
		expect(selected.number).toBe(42);
		expect(selected.isSubIssue).toBe(true);
		// Sub-issues should not trigger a project field update
		expect(github.updateProjectField).not.toHaveBeenCalled();
	});
});
