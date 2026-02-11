import { assert, describe, it } from "vitest";
import {
	calculateCost,
	estimateTokens,
	GEMINI_PRICING,
	getCheapestModel,
	MODEL_FALLBACK,
} from "./gemini-pricing.js";

describe("gemini-pricing", () => {
	describe("GEMINI_PRICING", () => {
		it("should have pricing for all production models", () => {
			assert.ok(GEMINI_PRICING["gemini-2.5-flash-lite"]);
			assert.ok(GEMINI_PRICING["gemini-2.5-flash"]);
			assert.ok(GEMINI_PRICING["gemini-2.5-pro"]);
		});

		it("should have input and output prices", () => {
			const pricing = GEMINI_PRICING["gemini-2.5-flash-lite"];
			assert.strictEqual(typeof pricing.input, "number");
			assert.strictEqual(typeof pricing.output, "number");
			assert.ok(pricing.input > 0);
			assert.ok(pricing.output > 0);
		});

		it("should have tier information", () => {
			assert.strictEqual(
				GEMINI_PRICING["gemini-2.5-flash-lite"].tier,
				"production",
			);
			assert.strictEqual(
				GEMINI_PRICING["gemini-3-flash-preview"].tier,
				"preview",
			);
		});
	});

	describe("MODEL_FALLBACK", () => {
		it("should have fallback chains for flash, pro, and image", () => {
			assert.ok(Array.isArray(MODEL_FALLBACK.flash));
			assert.ok(Array.isArray(MODEL_FALLBACK.pro));
			assert.ok(Array.isArray(MODEL_FALLBACK.image));
		});

		it("should order flash models by cost (cheapest first)", () => {
			const flashChain = MODEL_FALLBACK.flash;
			assert.strictEqual(flashChain[0], "gemini-2.5-flash-lite"); // Cheapest
			assert.strictEqual(flashChain[1], "gemini-2.5-flash");
			assert.strictEqual(flashChain[2], "gemini-3-flash-preview"); // Most expensive
		});

		it("should order pro models by cost (cheapest first)", () => {
			const proChain = MODEL_FALLBACK.pro;
			assert.strictEqual(proChain[0], "gemini-2.5-pro"); // Cheapest
			assert.strictEqual(proChain[1], "gemini-3-pro-preview"); // Most expensive
		});
	});

	describe("calculateCost", () => {
		it("should calculate cost for gemini-2.5-flash-lite correctly", () => {
			const result = calculateCost("gemini-2.5-flash-lite", 250, 50);

			// Input: 250 / 1M * $0.0375 = $0.000009375
			// Output: 50 / 1M * $0.15 = $0.0000075
			// Total: $0.000016875

			assert.strictEqual(result.inputCost.toFixed(9), "0.000009375");
			assert.strictEqual(result.outputCost.toFixed(9), "0.000007500");
			assert.strictEqual(result.totalCost.toFixed(9), "0.000016875");
			assert.strictEqual(result.model, "gemini-2.5-flash-lite");
			assert.strictEqual(result.inputTokens, 250);
			assert.strictEqual(result.outputTokens, 50);
		});

		it("should calculate cost for gemini-2.5-pro correctly", () => {
			const result = calculateCost("gemini-2.5-pro", 1000, 200);

			// Input: 1000 / 1M * $1.25 = $0.00125
			// Output: 200 / 1M * $5.00 = $0.001
			// Total: $0.00225

			assert.strictEqual(result.inputCost.toFixed(5), "0.00125");
			assert.strictEqual(result.outputCost.toFixed(5), "0.00100");
			assert.strictEqual(result.totalCost.toFixed(5), "0.00225");
		});

		it("should throw error for unknown model", () => {
			assert.throws(() => {
				calculateCost("unknown-model", 100, 50);
			}, /Unknown model/);
		});

		it("should handle zero tokens", () => {
			const result = calculateCost("gemini-2.5-flash-lite", 0, 0);
			assert.strictEqual(result.totalCost, 0);
		});

		it("should handle large token counts", () => {
			const result = calculateCost("gemini-2.5-flash-lite", 1_000_000, 500_000);

			// Input: 1M / 1M * $0.0375 = $0.0375
			// Output: 500K / 1M * $0.15 = $0.075
			// Total: $0.1125

			assert.strictEqual(result.totalCost.toFixed(4), "0.1125");
		});
	});

	describe("estimateTokens", () => {
		it("should estimate tokens from text length", () => {
			const text = "This is a test"; // 14 characters
			const tokens = estimateTokens(text);
			assert.strictEqual(tokens, Math.ceil(14 / 4)); // 4 tokens
		});

		it("should handle empty string", () => {
			assert.strictEqual(estimateTokens(""), 0);
		});

		it("should handle long text", () => {
			const text = "a".repeat(1000); // 1000 characters
			assert.strictEqual(estimateTokens(text), 250); // 250 tokens
		});
	});

	describe("getCheapestModel", () => {
		it("should return cheapest flash model", () => {
			assert.strictEqual(getCheapestModel("flash"), "gemini-2.5-flash-lite");
		});

		it("should return cheapest pro model", () => {
			assert.strictEqual(getCheapestModel("pro"), "gemini-2.5-pro");
		});

		it("should throw error for unknown model type", () => {
			assert.throws(() => {
				getCheapestModel("unknown");
			}, /Unknown model type/);
		});
	});
});
