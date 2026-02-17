import assert from "node:assert";
import { mock, test } from "node:test";
import { calculateCost, estimateTokens, getCheapestModel } from "./pricing.js";

test("Pricing Module", async (t) => {
	await t.test("should calculate cost for gemini-2.5-flash-lite", () => {
		const result = calculateCost("gemini-2.5-flash-lite", 1000, 1000);
		// Input: 1000 * 0.1 / 1_000_000 = 0.0001
		// Output: 1000 * 0.4 / 1_000_000 = 0.0004
		// Total: 0.0005
		assert.ok(Math.abs(result.totalCost - 0.0005) < 0.000001);
		assert.strictEqual(result.model, "gemini-2.5-flash-lite");
	});

	await t.test("should calculate cost for gemini-2.5-pro", () => {
		const result = calculateCost("gemini-2.5-pro", 1000, 1000);
		// Input: 1000 * 1.25 / 1_000_000 = 0.00125
		// Output: 1000 * 10.0 / 1_000_000 = 0.0100
		// Total: 0.01125
		assert.ok(Math.abs(result.totalCost - 0.01125) < 0.000001);
	});

	await t.test(
		"should fallback to gemini-2.5-flash-lite for unknown models",
		() => {
			const mockConsoleWarn = mock.method(console, "warn", () => {});
			const result = calculateCost("unknown-model", 1000, 1000);

			assert.strictEqual(result.model, "unknown-model"); // Keeps original model name
			// Should match flash-lite cost (0.0005)
			assert.ok(Math.abs(result.totalCost - 0.0005) < 0.000001);

			mockConsoleWarn.mock.restore();
		},
	);

	await t.test("should handle zero tokens", () => {
		const result = calculateCost("gemini-2.5-flash-lite", 0, 0);
		assert.strictEqual(result.totalCost, 0);
	});

	await t.test("estimateTokens should return correct estimate", () => {
		assert.strictEqual(estimateTokens("1234"), 1); // 4 chars = 1 token
		assert.strictEqual(estimateTokens("12345"), 2); // 5 chars = 2 tokens (ceil)
		assert.strictEqual(estimateTokens(""), 0);
	});

	await t.test("getCheapestModel should return first model in chain", () => {
		assert.strictEqual(getCheapestModel("flash"), "gemini-2.5-flash-lite");
		assert.strictEqual(getCheapestModel("pro"), "gemini-2.5-pro");
	});

	await t.test("getCheapestModel should throw on unknown type", () => {
		assert.throws(() => getCheapestModel("unknown"), /Unknown model type/);
	});
});
