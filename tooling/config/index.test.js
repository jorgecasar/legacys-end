import assert from "node:assert";
import fs from "node:fs";
import { mock, test } from "node:test";
import {
	FIELD_IDS,
	OPTION_IDS,
	OWNER,
	PROJECT_ID,
	REPO,
	writeGitHubOutput,
} from "./index.js";

test("Config Module", async (t) => {
	await t.test("should export correct constants", () => {
		assert.strictEqual(typeof PROJECT_ID, "string");
		assert.strictEqual(typeof OWNER, "string");
		assert.strictEqual(typeof REPO, "string");
		assert.strictEqual(typeof FIELD_IDS, "object");
		assert.strictEqual(typeof OPTION_IDS, "object");
	});

	await t.test(
		"writeGitHubOutput should write to file if GITHUB_OUTPUT set",
		async () => {
			const mockAppendFile = mock.method(fs, "appendFileSync", () => {});
			process.env.GITHUB_OUTPUT = "/tmp/output";

			writeGitHubOutput("key", "value");

			assert.strictEqual(mockAppendFile.mock.callCount(), 1);
			assert.strictEqual(
				mockAppendFile.mock.calls[0].arguments[0],
				"/tmp/output",
			);
			assert.strictEqual(
				mockAppendFile.mock.calls[0].arguments[1],
				"key=value\n",
			);

			mockAppendFile.mock.restore();
			delete process.env.GITHUB_OUTPUT;
		},
	);

	await t.test(
		"writeGitHubOutput should do nothing if GITHUB_OUTPUT not set",
		async () => {
			const mockAppendFile = mock.method(fs, "appendFileSync", () => {});
			delete process.env.GITHUB_OUTPUT;

			writeGitHubOutput("key", "value");

			assert.strictEqual(mockAppendFile.mock.callCount(), 0);

			mockAppendFile.mock.restore();
		},
	);
});
