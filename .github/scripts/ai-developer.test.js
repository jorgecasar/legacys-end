import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import { deps, getProjectRules, parseAIResponse } from "./ai-developer.js";

describe("ai-developer (Native Agent REST Tests)", () => {
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
	});

	describe("getProjectRules", () => {
		it("should aggregate rules from directory", () => {
			mock.method(deps, "readdirSync", () => ["rule1.md"]);
			mock.method(deps, "readFileSync", () => "rule content");
			mock.method(deps, "existsSync", () => true);

			const rules = getProjectRules("fake-rules");
			assert.ok(rules.includes("RULE [rule1.md]"));
			assert.ok(rules.includes("rule content"));
		});
	});
});
