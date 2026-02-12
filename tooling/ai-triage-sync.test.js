import assert from "node:assert";
import { spawn } from "node:child_process";
import { describe, it, mock } from "node:test";
import { syncTriageData } from "./ai-triage-sync.js";

describe("ai-triage-sync", () => {
	process.env.GH_TOKEN = "mock-token";
	it("should call Octokit methods with correct parameters", async () => {
		const octokitMock = {
			rest: {
				issues: {
					get: mock.fn(async () => ({
						data: { node_id: "I_kwDOAA562c6RzBcd" },
					})),
					addLabels: mock.fn(async () => ({})),
				},
			},
			graphql: mock.fn(async (query) => {
				if (query.includes("addProjectV2ItemById")) {
					return { addProjectV2ItemById: { item: { id: "PVTI_test123" } } };
				}
				return {
					updateProjectV2ItemFieldValue: {
						projectV2Item: { id: "PVTI_test123" },
					},
				};
			}),
		};

		const input = JSON.stringify({
			issue_number: 1,
			model: "flash",
			priority: "P0",
			labels: ["test"],
		});

		await syncTriageData(input, { octokit: octokitMock });

		assert.strictEqual(octokitMock.rest.issues.get.mock.calls.length, 1);
		assert.strictEqual(octokitMock.graphql.mock.calls.length >= 3, true);
		assert.strictEqual(octokitMock.rest.issues.addLabels.mock.calls.length, 1);
	});

	it("should work even when optional fields are missing", async () => {
		const octokitMock = {
			rest: {
				issues: {
					get: mock.fn(async () => ({
						data: { node_id: "I_kwDOAA562c6RzBcd" },
					})),
					addLabels: mock.fn(async () => ({})),
				},
			},
			graphql: mock.fn(async (query) => {
				if (query.includes("addProjectV2ItemById")) {
					return { addProjectV2ItemById: { item: { id: "PVTI_test123" } } };
				}
				return {
					updateProjectV2ItemFieldValue: {
						projectV2Item: { id: "PVTI_test123" },
					},
				};
			}),
		};

		const input = JSON.stringify({
			issue_number: 1,
			labels: [],
		});

		await syncTriageData(input, { octokit: octokitMock });

		assert.strictEqual(octokitMock.rest.issues.get.mock.calls.length, 1);
		assert.strictEqual(octokitMock.graphql.mock.calls.length, 2);
	});

	it("should return early if no input is provided", async () => {
		process.env.NODE_ENV = "test";
		const consoleErrorMock = mock.method(console, "error", () => {});
		await syncTriageData(undefined);
		assert.ok(consoleErrorMock.mock.calls.length > 0);
		consoleErrorMock.mock.restore();
	});

	it("should execute as a main process", async () => {
		return new Promise((resolve, reject) => {
			const cp = spawn("node", ["tooling/ai-triage-sync.js", "{}"], {
				env: { ...process.env, NODE_ENV: "test" },
			});
			cp.on("exit", (code) => {
				if (code === 0 || code === 1) resolve();
				else reject(new Error(`Process failed with code ${code}`));
			});
		});
	});
});
