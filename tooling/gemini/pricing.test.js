import assert from "node:assert";
import { describe, it } from "node:test";
import { calculateCost, GEMINI_PRICING } from "./pricing.js";

describe("Gemini Pricing Regression Tests", () => {
	it("should have correct pricing constants for all models", () => {
		// Gemini 2.5 Flash Lite: $0.1 / 1M input, $0.4 / 1M output
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-flash-lite"].input, 0.1);
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-flash-lite"].output, 0.4);

		// Gemini 2.5 Flash: $0.3 / 1M input, $2.5 / 1M output
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-flash"].input, 0.3);
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-flash"].output, 2.5);

		// Gemini 2.5 Pro: $1.25 / 1M input, $10.0 / 1M output
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-pro"].input, 1.25);
		assert.strictEqual(GEMINI_PRICING["gemini-2.5-pro"].output, 10.0);
	});

	it("should calculate cost correctly for Flash Lite", () => {
		// 1M input tokens @ $0.1 = $0.1
		// 1M output tokens @ $0.4 = $0.4
		const cost = calculateCost("gemini-2.5-flash-lite", 1_000_000, 1_000_000);
		assert.strictEqual(cost.inputCost, 0.1);
		assert.strictEqual(cost.outputCost, 0.4);
		assert.strictEqual(cost.totalCost, 0.5);
	});

	it("should calculate cost correctly for Flash", () => {
		// 1M input tokens @ $0.3 = $0.3
		// 1M output tokens @ $2.5 = $2.5
		const cost = calculateCost("gemini-2.5-flash", 1_000_000, 1_000_000);
		assert.strictEqual(cost.inputCost, 0.3);
		assert.strictEqual(cost.outputCost, 2.5);
		assert.strictEqual(cost.totalCost, 2.8);
	});

	it("should calculate cost correctly for Pro", () => {
		// 1M input tokens @ $1.25 = $1.25
		// 1M output tokens @ $10.0 = $10.0
		const cost = calculateCost("gemini-2.5-pro", 1_000_000, 1_000_000);
		assert.strictEqual(cost.inputCost, 1.25);
		assert.strictEqual(cost.outputCost, 10.0);
		assert.strictEqual(cost.totalCost, 11.25);
	});

	it("should handle small token counts accurately without rounding issues", () => {
		// 250 input tokens @ gemini-2.5-flash-lite ($0.1/1M) = 250 / 1M * 0.1 = 0.000025
		// 50 output tokens @ gemini-2.5-flash-lite ($0.4/1M) = 50 / 1M * 0.4 = 0.000020
		const cost = calculateCost("gemini-2.5-flash-lite", 250, 50);
		assert.strictEqual(cost.inputCost, 0.000025);
		assert.strictEqual(cost.outputCost, 0.00002);
		assert.strictEqual(cost.totalCost, 0.000045);
	});

	it("should throw error for unknown models", () => {
		assert.throws(
			() => calculateCost("unknown-model", 100, 100),
			/Unknown model/,
		);
	});
});
