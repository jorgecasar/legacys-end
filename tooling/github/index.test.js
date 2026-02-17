import assert from "node:assert";
import { mock, test } from "node:test";
import { PROJECT_ID } from "../config/index.js";
import * as github from "./index.js";

test("GitHub Utils", async (t) => {
	const mockGraphql = mock.fn();
	const mockRestGet = mock.fn();
	const mockRestCreateComment = mock.fn();

	class MockOctokit {
		constructor(options) {
			this.auth = options.auth;
			this.graphql = mockGraphql;
			this.rest = {
				issues: {
					get: mockRestGet,
					createComment: mockRestCreateComment,
				},
			};
		}
	}

	// Helper to get a mocked octokit
	const getMockedOctokit = () => github.getOctokit(MockOctokit);

	t.beforeEach(() => {
		mockGraphql.mock.resetCalls();
		mockRestGet.mock.resetCalls();
		mockRestCreateComment.mock.resetCalls();
		process.env.GH_TOKEN = "test-token";
	});

	await t.test("getOctokit should return authenticated instance", () => {
		const octokit = github.getOctokit(MockOctokit);
		assert.ok(octokit instanceof MockOctokit);
		assert.strictEqual(octokit.auth, "test-token");
	});

	await t.test("getOctokit should throw if no token", () => {
		delete process.env.GH_TOKEN;
		assert.throws(() => github.getOctokit(MockOctokit), /Missing GH_TOKEN/);
	});

	await t.test("getIssue should fetch issue details", async () => {
		const octokit = getMockedOctokit();
		mockRestGet.mock.mockImplementation(async () => ({
			data: { title: "Test" },
		}));

		const issue = await github.getIssue(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});

		assert.strictEqual(issue.title, "Test");
		assert.strictEqual(mockRestGet.mock.callCount(), 1);
	});

	await t.test("getIssueNodeId should return node_id", async () => {
		const octokit = getMockedOctokit();
		mockRestGet.mock.mockImplementation(async () => ({
			data: { node_id: "node-1" },
		}));

		const nodeId = await github.getIssueNodeId(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});

		assert.strictEqual(nodeId, "node-1");
	});

	await t.test("createSubIssue should call graphql mutation", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			addSubIssue: { subIssue: { id: "sub-1" } },
		}));

		await github.createSubIssue(octokit, "parent-id", "child-id");

		assert.strictEqual(mockGraphql.mock.callCount(), 1);
		const args = mockGraphql.mock.calls[0].arguments;
		assert.match(args[0], /mutation/);
	});

	await t.test("getSubIssues should return sub-issues", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			repository: {
				issue: { subIssues: { nodes: [{ number: 2, state: "OPEN" }] } },
			},
		}));

		const subIssues = await github.getSubIssues(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});
		assert.strictEqual(subIssues.length, 1);
		assert.strictEqual(subIssues[0].number, 2);
	});

	await t.test("getSubIssues should handle errors gracefully", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => {
			throw new Error("GraphQL Error");
		});
		const mockConsoleWarn = mock.method(console, "warn", () => {});

		const subIssues = await github.getSubIssues(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});
		assert.deepStrictEqual(subIssues, []);
		assert.strictEqual(mockConsoleWarn.mock.callCount(), 1);

		mockConsoleWarn.mock.restore();
	});

	await t.test("hasOpenSubtasks should return count", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			repository: {
				issue: {
					subIssues: { nodes: [{ state: "OPEN" }, { state: "CLOSED" }] },
				},
			},
		}));

		const count = await github.hasOpenSubtasks(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});
		assert.strictEqual(count, 1);
	});

	await t.test("hasOpenSubtasks should handle errors gracefully", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => {
			throw new Error("GraphQL Error");
		});
		const mockConsoleWarn = mock.method(console, "warn", () => {});

		const count = await github.hasOpenSubtasks(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
		});
		assert.strictEqual(count, 0);
		assert.strictEqual(mockConsoleWarn.mock.callCount(), 1);

		mockConsoleWarn.mock.restore();
	});

	await t.test("addIssueToProject should call graphql mutation", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			addProjectV2ItemById: { item: { id: "item-1" } },
		}));

		const itemId = await github.addIssueToProject(octokit, "content-id");

		assert.strictEqual(itemId, "item-1");
		const args = mockGraphql.mock.calls[0].arguments;
		assert.strictEqual(args[1].projectId, PROJECT_ID);
	});

	await t.test("updateProjectField should handle text values", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } },
		}));

		await github.updateProjectField(octokit, "item-1", "field-1", "text-value");

		const args = mockGraphql.mock.calls[0].arguments;
		assert.deepStrictEqual(args[1].value, { text: "text-value" });
	});

	await t.test("updateProjectField number logic check", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } },
		}));

		await github.updateProjectField(octokit, "item-1", "field-1", 123);
		const args = mockGraphql.mock.calls[0].arguments;
		assert.deepStrictEqual(args[1].value, { number: 123 });
	});

	await t.test("updateProjectField single select logic check", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } },
		}));

		// Heuristic: fieldId starts with PVTSSF and value is 8 chars
		await github.updateProjectField(
			octokit,
			"item-1",
			"PVTSSF_field",
			"12345678",
		);
		const args = mockGraphql.mock.calls[0].arguments;
		assert.deepStrictEqual(args[1].value, { singleSelectOptionId: "12345678" });
	});

	await t.test("fetchProjectItems should return formatted items", async () => {
		const octokit = getMockedOctokit();
		mockGraphql.mock.mockImplementation(async () => ({
			node: {
				items: {
					nodes: [
						{
							id: "item-1",
							content: {
								number: 123,
								title: "Title",
								body: "Body",
								labels: { nodes: [{ name: "bug" }] },
								parent: { number: 100, labels: { nodes: [] } },
								subIssues: { nodes: [] },
							},
							status: { name: "Todo" },
							priority: { name: "P1" },
						},
					],
				},
			},
		}));

		const items = await github.fetchProjectItems(octokit);

		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].number, 123);
	});

	await t.test(
		"fetchProjectItems should handle complex edge cases",
		async () => {
			const octokit = getMockedOctokit();
			mockGraphql.mock.mockImplementation(async () => ({
				node: {
					items: {
						nodes: [
							{
								id: "item-1",
								content: {
									number: 123,
									// Missing optional fields to test fallbacks
									labels: null,
									parent: null,
									subIssues: {
										nodes: [
											{ number: 456, labels: null }, // Sub-issue with no labels
											{ number: 789, labels: { nodes: [] } },
										],
									},
								},
							},
						],
					},
				},
			}));

			const items = await github.fetchProjectItems(octokit);

			assert.strictEqual(items.length, 1);
			assert.strictEqual(items[0].labels.length, 0);
			assert.strictEqual(items[0].parentLabels.length, 0);
			assert.strictEqual(items[0].subIssues.length, 2);
			assert.strictEqual(items[0].subIssues[0].labels.length, 0); // Should default to empty array
		},
	);

	await t.test("addIssueComment should create comment", async () => {
		const octokit = getMockedOctokit();
		mockRestCreateComment.mock.mockImplementation(async () => ({
			data: { id: 1 },
		}));

		await github.addIssueComment(octokit, {
			owner: "o",
			repo: "r",
			issueNumber: 1,
			body: "Hi",
		});

		assert.strictEqual(mockRestCreateComment.mock.callCount(), 1);
	});
});
