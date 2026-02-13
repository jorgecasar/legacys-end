import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import { trackUsage } from "../monitoring/usage-tracker.js";

// Mock Octokit
const mockOctokit = {
	rest: {
		issues: {
			get: mock.fn(() =>
				Promise.resolve({ data: { node_id: "I_kwDOAA562c6RzBcd" } }),
			),
			listComments: mock.fn(() => Promise.resolve({ data: [] })),
			createComment: mock.fn(() => Promise.resolve({ data: { id: 123 } })),
			updateComment: mock.fn(() => Promise.resolve({ data: { id: 123 } })),
		},
	},
};

describe("ai-usage-tracker", () => {
	beforeEach(() => {
		mock.restoreAll();
		// Reset mocks manually
		mockOctokit.rest.issues.get.mock.resetCalls();
		mockOctokit.rest.issues.listComments.mock.resetCalls();
		mockOctokit.rest.issues.createComment.mock.resetCalls();
		mockOctokit.rest.issues.updateComment.mock.resetCalls();

		// Set default implementations
		mockOctokit.rest.issues.get.mock.mockImplementation(() =>
			Promise.resolve({ data: { node_id: "I_kwDOAA562c6RzBcd" } }),
		);
		mockOctokit.rest.issues.listComments.mock.mockImplementation(() =>
			Promise.resolve({ data: [] }),
		);
		mockOctokit.rest.issues.createComment.mock.mockImplementation(() =>
			Promise.resolve({ data: { id: 123 } }),
		);
		mockOctokit.rest.issues.updateComment.mock.mockImplementation(() =>
			Promise.resolve({ data: { id: 123 } }),
		);
	});

	describe("trackUsage", () => {
		it("should create new metrics for first execution", async () => {
			const result = await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-flash-lite",
				inputTokens: 250,
				outputTokens: 50,
				operation: "triage",
				octokit: mockOctokit,
			});

			// Verify metrics
			assert.strictEqual(result.totalInputTokens, 250);
			assert.strictEqual(result.totalOutputTokens, 50);
			assert.ok(result.totalCost > 0);
			assert.strictEqual(result.operations.length, 1);
			assert.strictEqual(result.operations[0].operation, "triage");
			assert.strictEqual(result.operations[0].model, "gemini-2.5-flash-lite");

			// Verify comment was created
			assert.strictEqual(
				mockOctokit.rest.issues.listComments.mock.callCount(),
				2,
			);
			assert.strictEqual(
				mockOctokit.rest.issues.createComment.mock.callCount(),
				1,
			);
			const commentBody =
				mockOctokit.rest.issues.createComment.mock.calls[0].arguments[0].body;
			assert.ok(commentBody.includes("AI_USAGE_METRICS"));
			assert.ok(commentBody.includes("**Total Tokens**: 300"));
		});

		it("should accumulate metrics across multiple executions", async () => {
			// Mock: existing comment with metrics
			const existingComment = {
				id: 123,
				body: `<!-- AI_USAGE_METRICS -->
## 📊 AI Usage Report

\`\`\`json
{
  "totalInputTokens": 250,
  "totalOutputTokens": 50,
  "totalCost": 0.000016875,
  "operations": [
    {
      "operation": "triage",
      "model": "gemini-2.5-flash-lite",
      "inputTokens": 250,
      "outputTokens": 50,
      "cost": 0.000016875,
      "timestamp": "2026-02-11T20:00:00.000Z"
    }
  ]
}
\`\`\`
`,
			};

			mockOctokit.rest.issues.listComments.mock.mockImplementation(() =>
				Promise.resolve({ data: [existingComment] }),
			);

			const result = await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-flash-lite",
				inputTokens: 250,
				outputTokens: 50,
				operation: "triage",
				octokit: mockOctokit,
			});

			// Verify accumulated metrics
			assert.strictEqual(result.totalInputTokens, 500); // 250 + 250
			assert.strictEqual(result.totalOutputTokens, 100); // 50 + 50
			assert.strictEqual(result.operations.length, 2);

			// Verify comment was updated (not created)
			assert.strictEqual(
				mockOctokit.rest.issues.updateComment.mock.callCount(),
				1,
			);
			assert.strictEqual(
				mockOctokit.rest.issues.createComment.mock.callCount(),
				0,
			);
		});

		it("should handle different models in operations", async () => {
			// Mock: existing comment for second operation
			const existingComment = {
				id: 123,
				body: `<!-- AI_USAGE_METRICS -->
\`\`\`json
{
  "totalInputTokens": 250,
  "totalOutputTokens": 50,
  "totalCost": 0.000016875,
  "operations": [
    {
      "operation": "triage",
      "model": "gemini-2.5-flash-lite",
      "inputTokens": 250,
      "outputTokens": 50,
      "cost": 0.000016875,
      "timestamp": "2026-02-11T20:00:00.000Z"
    }
  ]
}
\`\`\`
`,
			};

			mockOctokit.rest.issues.listComments.mock.mockImplementation(() =>
				Promise.resolve({ data: [existingComment] }),
			);

			// Second operation: pro (more expensive)
			const result = await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-pro",
				inputTokens: 1000,
				outputTokens: 200,
				operation: "worker",
				octokit: mockOctokit,
			});

			// Verify both operations are tracked
			assert.strictEqual(result.operations.length, 2);
			assert.strictEqual(result.operations[0].model, "gemini-2.5-flash-lite");
			assert.strictEqual(result.operations[1].model, "gemini-2.5-pro");

			// Verify total cost is sum of both
			assert.ok(result.totalCost > 0.000016875); // More than just flash-lite
		});

		it("should handle malformed existing comment gracefully", async () => {
			// Mock: existing comment with invalid JSON
			const existingComment = {
				id: 123,
				body: `<!-- AI_USAGE_METRICS -->
Invalid JSON here
`,
			};

			mockOctokit.rest.issues.listComments.mock.mockImplementation(() =>
				Promise.resolve({ data: [existingComment] }),
			);

			const result = await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-flash-lite",
				inputTokens: 250,
				outputTokens: 50,
				operation: "triage",
				octokit: mockOctokit,
			});

			// Should start fresh if existing comment is malformed
			assert.strictEqual(result.totalInputTokens, 250);
			assert.strictEqual(result.operations.length, 1);
		});

		it("should round cost to 8 decimal places for project updates", async () => {
			mockOctokit.graphql = mock.fn((query) => {
				if (query.includes("repository")) {
					return Promise.resolve({
						repository: { issue: { id: "issue-node-123" } },
					});
				}
				if (query.includes("addProjectV2ItemById")) {
					return Promise.resolve({
						addProjectV2ItemById: { item: { id: "item-123" } },
					});
				}
				if (query.includes("updateProjectV2ItemFieldValue")) {
					return Promise.resolve({
						updateProjectV2ItemFieldValue: {
							projectV2Item: { id: "item-123" },
						},
					});
				}
				return Promise.resolve({});
			});

			const result = await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-flash-lite",
				inputTokens: 250,
				outputTokens: 50,
				operation: "triage",
				octokit: mockOctokit,
			});

			// Verify totalCost in metrics
			assert.ok(result.totalCost > 0);

			// Verify GraphQL call for updateProjectV2ItemFieldValue
			const updateCall = mockOctokit.graphql.mock.calls.find((c) =>
				c.arguments[0].includes("updateProjectV2ItemFieldValue"),
			);
			assert.ok(updateCall, "GraphQL update mutation should be called");

			const value = updateCall.arguments[1].value.number;
			const decimals = String(value).split(".")[1] || "";
			assert.ok(
				decimals.length <= 8,
				`Cost decimals ${decimals.length} should be <= 8. Value: ${value}`,
			);
		});
	});
});
