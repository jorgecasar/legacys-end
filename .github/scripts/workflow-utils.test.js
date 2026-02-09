import assert from "node:assert";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import { beforeEach, describe, it, mock } from "node:test";
import {
	addIssueToProject,
	autoPickTask,
	getProjectItemId,
	graphql,
	STATUS_OPTIONS,
	updateProjectStatus,
} from "./workflow-utils.js";

// Mock global fetch
global.fetch = mock.fn();

describe("workflow-utils (Node.js Test Runner)", () => {
	beforeEach(() => {
		mock.reset();
		process.env.GITHUB_TOKEN = "test-token";
		process.env.PROJECT_ID = "test-project-id";
		process.env.STATUS_FIELD_ID = "test-status-field-id";
		process.env.GITHUB_REPOSITORY = "owner/repo";
	});

	describe("Environment Validation", () => {
		it("should throw error if GITHUB_TOKEN is missing in graphql", async () => {
			const originalToken = process.env.GITHUB_TOKEN;
			delete process.env.GITHUB_TOKEN;
			await assert.rejects(() => graphql("query { test }"), {
				message: "Environment variable GITHUB_TOKEN is missing.",
			});
			process.env.GITHUB_TOKEN = originalToken;
		});

		it("should throw error if PROJECT_ID is missing in getProjectItemId", async () => {
			const originalProjectId = process.env.PROJECT_ID;
			delete process.env.PROJECT_ID;
			await assert.rejects(() => getProjectItemId(10), {
				message: "Environment variable PROJECT_ID is missing.",
			});
			process.env.PROJECT_ID = originalProjectId;
		});
	});

	describe("API Error Handling", () => {
		it("should handle HTTP errors gracefully", async () => {
			global.fetch.mock.mockImplementationOnce(() =>
				Promise.resolve({
					ok: false,
					status: 403,
					text: () => Promise.resolve("Forbidden Access"),
				}),
			);

			await assert.rejects(
				() => graphql("query { test }"),
				/HTTP Error 403: Forbidden Access/,
			);
		});

		it("should handle GraphQL specific errors", async () => {
			global.fetch.mock.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							errors: [{ message: "Resource not accessible by integration" }],
						}),
				}),
			);

			await assert.rejects(() => graphql("query { test }"), /GraphQL Error/);
		});
	});

	describe("autoPickTask (Priority Logic)", () => {
		it("should prioritize Paused (429) tasks from the lowest Milestone", async () => {
			global.fetch.mock.mockImplementationOnce(() =>
				Promise.resolve({
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
				}),
			);

			const num = await autoPickTask();
			assert.strictEqual(num, 2);
		});
	});
});
