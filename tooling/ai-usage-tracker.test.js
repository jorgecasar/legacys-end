import { assert, beforeEach, describe, it, vi } from "vitest";
import { trackUsage } from "./ai-usage-tracker.js";

// Mock Octokit
const mockOctokit = {
	rest: {
		issues: {
			listComments: vi.fn(),
			createComment: vi.fn(),
			updateComment: vi.fn(),
		},
	},
};

describe("ai-usage-tracker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("trackUsage", () => {
		it("should create new metrics for first execution", async () => {
			// Mock: no existing comments
			mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] });
			mockOctokit.rest.issues.createComment.mockResolvedValue({
				data: { id: 123 },
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

			// Verify metrics
			assert.strictEqual(result.totalInputTokens, 250);
			assert.strictEqual(result.totalOutputTokens, 50);
			assert.ok(result.totalCost > 0);
			assert.strictEqual(result.operations.length, 1);
			assert.strictEqual(result.operations[0].operation, "triage");
			assert.strictEqual(result.operations[0].model, "gemini-2.5-flash-lite");

			// Verify comment was created
			assert.ok(mockOctokit.rest.issues.createComment.called);
			const commentBody =
				mockOctokit.rest.issues.createComment.mock.calls[0][0].body;
			assert.ok(commentBody.includes("AI_USAGE_METRICS"));
			assert.ok(commentBody.includes("Total Tokens: 300"));
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

			mockOctokit.rest.issues.listComments.mockResolvedValue({
				data: [existingComment],
			});
			mockOctokit.rest.issues.updateComment.mockResolvedValue({
				data: { id: 123 },
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

			// Verify accumulated metrics
			assert.strictEqual(result.totalInputTokens, 500); // 250 + 250
			assert.strictEqual(result.totalOutputTokens, 100); // 50 + 50
			assert.strictEqual(result.operations.length, 2);

			// Verify comment was updated (not created)
			assert.ok(mockOctokit.rest.issues.updateComment.called);
			assert.ok(!mockOctokit.rest.issues.createComment.called);
		});

		it("should handle different models in operations", async () => {
			mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] });
			mockOctokit.rest.issues.createComment.mockResolvedValue({
				data: { id: 123 },
			});

			// First operation: flash-lite
			await trackUsage({
				owner: "test-owner",
				repo: "test-repo",
				issueNumber: 42,
				model: "gemini-2.5-flash-lite",
				inputTokens: 250,
				outputTokens: 50,
				operation: "triage",
				octokit: mockOctokit,
			});

			// Mock existing comment for second operation
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

			mockOctokit.rest.issues.listComments.mockResolvedValue({
				data: [existingComment],
			});
			mockOctokit.rest.issues.updateComment.mockResolvedValue({
				data: { id: 123 },
			});

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

			mockOctokit.rest.issues.listComments.mockResolvedValue({
				data: [existingComment],
			});
			mockOctokit.rest.issues.updateComment.mockResolvedValue({
				data: { id: 123 },
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

			// Should start fresh if existing comment is malformed
			assert.strictEqual(result.totalInputTokens, 250);
			assert.strictEqual(result.operations.length, 1);
		});
	});
});
