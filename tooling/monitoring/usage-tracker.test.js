import assert from "node:assert";
import { mock, test } from "node:test";
import {
	getExistingMetrics,
	postUsageComment,
	trackUsage,
	updateProjectCost,
} from "./usage-tracker.js";

test("Usage Tracker", async (t) => {
	t.beforeEach(() => {
		mock.method(console, "log", () => {});
		mock.method(console, "error", () => {});
		mock.method(console, "warn", () => {});
	});

	t.afterEach(() => {
		mock.restoreAll();
	});

	await t.test("trackUsage should accumulate metrics", async () => {
		const mockOctokit = {};
		const mockCalculateCost = mock.fn(() => ({ totalCost: 0.1 }));
		const mockGetExistingMetrics = mock.fn(async () => ({
			totalInputTokens: 100,
			totalOutputTokens: 50,
			totalCost: 0.05,
			operations: [],
		}));
		const mockPostUsageComment = mock.fn();
		const mockUpdateProjectCost = mock.fn();

		const params = {
			owner: "owner",
			repo: "repo",
			issueNumber: 1,
			model: "model",
			inputTokens: 10,
			outputTokens: 5,
			operation: "op",
			octokit: mockOctokit,
			calculateCost: mockCalculateCost,
			getExistingMetrics: mockGetExistingMetrics,
			postUsageComment: mockPostUsageComment,
			updateProjectCost: mockUpdateProjectCost,
		};

		const result = await trackUsage(params);

		assert.strictEqual(result.totalInputTokens, 110);
		assert.strictEqual(result.totalOutputTokens, 55);
		assert.ok(Math.abs(result.totalCost - 0.15) < 0.000001);
		assert.strictEqual(result.operations.length, 1);
		assert.strictEqual(mockPostUsageComment.mock.callCount(), 1);
		assert.strictEqual(mockUpdateProjectCost.mock.callCount(), 1);
	});

	await t.test(
		"getExistingMetrics should parse metrics from comments",
		async () => {
			const mockListComments = mock.fn(async () => ({
				data: [
					{
						body: `Some comment
<!-- AI_USAGE_METRICS -->
\`\`\`json
{"totalInputTokens": 10, "totalOutputTokens": 5, "totalCost": 0.01, "operations": []}
\`\`\``,
					},
				],
			}));
			const mockOctokit = {
				rest: {
					issues: {
						listComments: mockListComments,
					},
				},
			};

			const metrics = await getExistingMetrics(mockOctokit, "owner", "repo", 1);
			assert.strictEqual(metrics.totalInputTokens, 10);
		},
	);

	await t.test("getExistingMetrics should handle malformed JSON", async () => {
		const mockListComments = mock.fn(async () => ({
			data: [
				{
					body: `<!-- AI_USAGE_METRICS -->
\`\`\`json
{invalid}
\`\`\``,
				},
			],
		}));
		const mockOctokit = {
			rest: {
				issues: {
					listComments: mockListComments,
				},
			},
		};

		const metrics = await getExistingMetrics(mockOctokit, "owner", "repo", 1);
		assert.strictEqual(metrics.totalInputTokens, 0);
	});

	await t.test("getExistingMetrics should handle API error", async () => {
		const mockOctokit = {
			rest: {
				issues: {
					listComments: mock.fn(() => {
						throw new Error("API Error");
					}),
				},
			},
		};

		const metrics = await getExistingMetrics(mockOctokit, "owner", "repo", 1);
		assert.strictEqual(metrics.totalInputTokens, 0);
	});

	await t.test(
		"postUsageComment should create new comment if none exists",
		async () => {
			const mockListComments = mock.fn(async () => ({ data: [] }));
			const mockCreateComment = mock.fn(async () => ({ data: { id: 123 } }));
			const mockOctokit = {
				rest: {
					issues: {
						listComments: mockListComments,
						createComment: mockCreateComment,
					},
				},
			};

			await postUsageComment(mockOctokit, "owner", "repo", 1, {
				totalInputTokens: 0,
				totalOutputTokens: 0,
				totalCost: 0,
				operations: [],
			});

			assert.strictEqual(mockCreateComment.mock.callCount(), 1);
		},
	);

	await t.test("postUsageComment should update existing comment", async () => {
		const mockListComments = mock.fn(async () => ({
			data: [{ id: 456, body: "<!-- AI_USAGE_METRICS -->" }],
		}));
		const mockUpdateComment = mock.fn();
		const mockOctokit = {
			rest: {
				issues: {
					listComments: mockListComments,
					updateComment: mockUpdateComment,
				},
			},
		};

		await postUsageComment(mockOctokit, "owner", "repo", 1, {
			totalInputTokens: 0,
			totalOutputTokens: 0,
			totalCost: 0,
			operations: [],
		});

		assert.strictEqual(mockUpdateComment.mock.callCount(), 1);
	});

	await t.test("postUsageComment should handle API failure", async () => {
		const mockOctokit = {
			rest: {
				issues: {
					listComments: mock.fn(() => {
						throw new Error("API Error");
					}),
				},
			},
		};

		const metrics = {
			totalInputTokens: 0,
			totalOutputTokens: 0,
			totalCost: 0,
			operations: [],
		};

		try {
			await postUsageComment(mockOctokit, "owner", "repo", 1, metrics);
			assert.fail("Should have thrown");
		} catch (e) {
			assert.strictEqual(e.message, "API Error");
		}
	});

	await t.test("updateProjectCost should update project fields", async () => {
		const mockOctokit = {};
		const mockGetIssueNodeId = mock.fn(async () => "node-1");
		const mockAddIssueToProject = mock.fn(async () => "item-1");
		const mockUpdateProjectField = mock.fn();

		await updateProjectCost(mockOctokit, "owner", "repo", 1, 0.05, {
			getIssueNodeId: mockGetIssueNodeId,
			addIssueToProject: mockAddIssueToProject,
			updateProjectField: mockUpdateProjectField,
		});

		assert.strictEqual(mockUpdateProjectField.mock.callCount(), 1);
	});

	await t.test(
		"updateProjectCost should handle failures gracefully",
		async () => {
			const mockOctokit = {};
			const mockGetIssueNodeId = mock.fn(() => {
				throw new Error("Fail");
			});

			await updateProjectCost(mockOctokit, "owner", "repo", 1, 0.05, {
				getIssueNodeId: mockGetIssueNodeId,
			});
			// Should not throw
		},
	);
});
