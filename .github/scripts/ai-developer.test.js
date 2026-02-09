import assert from "node:assert";
import path from "node:path";
import { beforeEach, describe, it, mock } from "node:test";
import { deps, getProjectRules, parseAIResponse } from "./ai-developer.js";

describe("ai-developer (Native Agent Tests)", () => {
	beforeEach(() => {
		mock.reset();
	});

	describe("parseAIResponse", () => {
		it("should parse valid JSON from AI response", () => {
			const text = '{"thought": "test", "changes": []}';
			const result = parseAIResponse(text);
			assert.strictEqual(result.thought, "test");
			assert.deepStrictEqual(result.changes, []);
		});

		it("should clean markdown code blocks before parsing", () => {
			const text =
				"```json\n" + '{"thought": "clean", "changes": []}' + "\n```";
			const result = parseAIResponse(text);
			assert.strictEqual(result.thought, "clean");
		});

		it("should throw error on invalid JSON", () => {
			const text = "not a json";
			assert.throws(() => parseAIResponse(text), /Failed to parse AI response/);
		});
	});

	describe("getProjectRules", () => {
		it("should aggregate rules from directory", () => {
			mock.method(deps, "readdirSync", () => ["rule1.md", "rule2.md"]);
			mock.method(
				deps,
				"readFileSync",
				(p) => `Content of ${p.split(path.sep).pop()}`,
			);
			mock.method(deps, "existsSync", () => true);

			const rules = getProjectRules("fake-rules");
			assert.ok(rules.includes("RULE [rule1.md]"));
			assert.ok(rules.includes("Content of rule1.md"));
			assert.ok(rules.includes("RULE [rule2.md]"));
		});

		it("should return empty string if rules directory does not exist", () => {
			mock.method(deps, "existsSync", () => false);
			const rules = getProjectRules("non-existent");
			assert.strictEqual(rules, "");
		});
	});
});
