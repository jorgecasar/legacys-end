/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	addIssueToProject,
	autoPickTask,
	getProjectItemId,
	graphql,
	updateProjectStatus,
} from "./workflow-utils.js";

global.fetch = vi.fn();

describe("workflow-utils (Robustness Audit)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.GITHUB_TOKEN = "test-token";
		process.env.PROJECT_ID = "test-project-id";
		process.env.STATUS_FIELD_ID = "test-status-field-id";
		process.env.GITHUB_REPOSITORY = "owner/repo";
	});

	describe("Environment Validation", () => {
		it("should throw error if GITHUB_TOKEN is missing in graphql", async () => {
			delete process.env.GITHUB_TOKEN;
			await expect(graphql("query { test }")).rejects.toThrow(
				"GITHUB_TOKEN is missing",
			);
		});

		it("should throw error if PROJECT_ID is missing in getProjectItemId", async () => {
			delete process.env.PROJECT_ID;
			await expect(getProjectItemId(10)).rejects.toThrow(
				"PROJECT_ID is missing",
			);
		});
	});

	describe("API Error Handling", () => {
		it("should handle HTTP errors gracefully", async () => {
			fetch.mockResolvedValue({
				ok: false,
				status: 403,
				text: () => Promise.resolve("Forbidden Access"),
			});

			await expect(graphql("query { test }")).rejects.toThrow(
				"HTTP Error 403: Forbidden Access",
			);
		});

		it("should handle GraphQL specific errors", async () => {
			fetch.mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						errors: [{ message: "Resource not accessible by integration" }],
					}),
			});

			await expect(graphql("query { test }")).rejects.toThrow("GraphQL Error");
		});
	});

	describe("autoPickTask (Priority Logic)", () => {
		it("should prioritize Paused (429) tasks from the lowest Milestone", async () => {
			fetch.mockResolvedValue({
				ok: true,
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
													{ optionId: "f75ad846", field: { name: "Status" } },
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
													{ optionId: "f75ad846", field: { name: "Status" } },
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
