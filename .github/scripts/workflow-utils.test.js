/**
 * @vitest-environment node
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	addIssueToProject,
	autoPickTask,
	getFieldId,
	getOpenDependencies,
	getProjectItemId,
	gh,
	graphql,
	logSessionStats,
	PRICING,
	STATUS_OPTIONS,
	triageTask,
	updateProjectStatus,
} from "./workflow-utils.js";

vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
	default: {
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
	},
}));

// Mock global fetch
global.fetch = vi.fn();

describe("workflow-utils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.GITHUB_TOKEN = "test-token";
		process.env.PROJECT_ID = "test-project-id";
		process.env.STATUS_FIELD_ID = "test-status-field-id";
		process.env.GITHUB_REPOSITORY = "owner/repo";
	});

	describe("graphql", () => {
		it("should perform a GraphQL query", async () => {
			fetch.mockResolvedValue({
				json: () => Promise.resolve({ data: { test: "data" } }),
			});

			const result = await graphql("query { test }", { var: "val" });
			expect(result).toEqual({ test: "data" });
			expect(fetch).toHaveBeenCalledWith(
				"https://api.github.com/graphql",
				expect.any(Object),
			);
		});

		it("should throw error if GraphQL returns errors", async () => {
			fetch.mockResolvedValue({
				json: () => Promise.resolve({ errors: [{ message: "error" }] }),
			});

			await expect(graphql("query { test }")).rejects.toThrow("GraphQL Error");
		});
	});

	describe("gh", () => {
		it("should execute gh command and return trimmed output", () => {
			execSync.mockReturnValue("  output  \n");
			const result = gh("issue view 1");
			expect(result).toBe("output");
			expect(execSync).toHaveBeenCalledWith(
				"gh issue view 1",
				expect.any(Object),
			);
		});
	});

	describe("getProjectItemId", () => {
		it("should return the item ID for a given issue number", async () => {
			fetch.mockResolvedValue({
				json: () =>
					Promise.resolve({
						data: {
							node: {
								items: {
									nodes: [
										{ id: "item-1", content: { number: 10 } },
										{ id: "item-2", content: { number: 20 } },
									],
								},
							},
						},
					}),
			});

			const itemId = await getProjectItemId(10);
			expect(itemId).toBe("item-1");
		});
	});

	describe("updateProjectStatus", () => {
		it("should update project status correctly", async () => {
			// Mock getProjectItemId
			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: {
							node: {
								items: {
									nodes: [{ id: "item-10", content: { number: 10 } }],
								},
							},
						},
					}),
			});
			// Mock status update mutation
			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: { updateProjectV2ItemFieldValue: { clientMutationId: "1" } },
					}),
			});

			await updateProjectStatus(10, "IN_PROGRESS");
			expect(fetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("triageTask", () => {
		it("should assign a model based on complexity", async () => {
			execSync.mockReturnValue(
				JSON.stringify({
					title: "Fix bug",
					body: "Small fix",
					labels: [],
				}),
			);

			fetch.mockResolvedValue({
				json: () =>
					Promise.resolve({
						candidates: [
							{
								content: { parts: [{ text: "gemini-3-flash-preview" }] },
							},
						],
					}),
			});

			await triageTask(10);
			expect(execSync).toHaveBeenCalledWith(
				expect.stringContaining("issue edit 10 --add-label"),
				expect.any(Object),
			);
		});
	});

	describe("addIssueToProject", () => {
		it("should add an issue to the project", async () => {
			// Mock issue view to get issue ID
			execSync.mockReturnValueOnce(JSON.stringify({ id: "issue-node-id" }));
			// Mock GraphQL mutation
			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: {
							addProjectV2ItemById: {
								item: { id: "new-item-id" },
							},
						},
					}),
			});

			const result = await addIssueToProject(
				"https://github.com/owner/repo/issues/10",
			);
			expect(result).toBe("new-item-id");
			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining("addProjectV2ItemById"),
				}),
			);
		});
	});

	describe("getOpenDependencies", () => {
		it("should return open dependencies from body and native relationships", async () => {
			execSync.mockReturnValueOnce(JSON.stringify({ body: "Depends on #100" }));

			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: {
							repository: {
								issue: {
									blockedBy: { nodes: [{ number: 101, state: "OPEN" }] },
									trackedIssues: { nodes: [] },
								},
							},
						},
					}),
			});

			// Mock gh calls for checking state of text dependency #100
			execSync.mockReturnValueOnce("OPEN"); // state of #100
			execSync.mockReturnValueOnce("OPEN"); // state of #101

			const openDeps = await getOpenDependencies(10);
			expect(openDeps).toContain(100);
			expect(openDeps).toContain(101);
		});
	});

	describe("autoPickTask", () => {
		it("should pick a paused task over a todo task", async () => {
			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: {
							node: {
								items: {
									nodes: [
										{
											content: {
												number: 1,
												state: "OPEN",
												labels: { nodes: [] },
												milestone: { number: 1 },
											},
											fieldValues: {
												nodes: [
													{
														optionId: STATUS_OPTIONS.TODO,
														field: { name: "Status" },
													},
												],
											},
										},
										{
											content: {
												number: 2,
												state: "OPEN",
												labels: { nodes: [] },
												milestone: { number: 1 },
											},
											fieldValues: {
												nodes: [
													{
														optionId: STATUS_OPTIONS.PAUSED_429,
														field: { name: "Status" },
													},
												],
											},
										},
									],
								},
							},
						},
					}),
			});

			const num = await autoPickTask();
			expect(num).toBe(2);
		});

		it("should pick tasks from the lowest milestone", async () => {
			fetch.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						data: {
							node: {
								items: {
									nodes: [
										{
											content: {
												number: 1,
												state: "OPEN",
												labels: { nodes: [] },
												milestone: { number: 2 },
											},
											fieldValues: {
												nodes: [
													{
														optionId: STATUS_OPTIONS.TODO,
														field: { name: "Status" },
													},
												],
											},
										},
										{
											content: {
												number: 2,
												state: "OPEN",
												labels: { nodes: [] },
												milestone: { number: 1 },
											},
											fieldValues: {
												nodes: [
													{
														optionId: STATUS_OPTIONS.TODO,
														field: { name: "Status" },
													},
												],
											},
										},
									],
								},
							},
						},
					}),
			});

			const num = await autoPickTask();
			expect(num).toBe(2);
		});
	});
});
