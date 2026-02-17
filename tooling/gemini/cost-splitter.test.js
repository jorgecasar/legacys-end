import assert from "node:assert";
import { test } from "node:test";

// The function we are about to create
import { splitTriageCosts } from "./cost-splitter.js";

test("Triage Cost Splitter", async (t) => {
	await t.test(
		"should split costs proportionally among multiple candidates",
		() => {
			const candidates = [
				{ number: 1, title: "Short", body: "1234" }, // ~1 token for body, more for full JSON
				{ number: 2, title: "Long", body: "1234567812345678" }, // ~4 tokens for body
			];

			// Estimate self tokens
			const self1 = Math.ceil(JSON.stringify(candidates[0]).length / 4); // e.g., ~10 tokens
			const self2 = Math.ceil(JSON.stringify(candidates[1]).length / 4); // e.g., ~15 tokens
			const totalSelf = self1 + self2; // ~25

			const totalInputTokens = 1000;
			const totalOutputTokens = 200;
			const commonContext = totalInputTokens - totalSelf; // ~975
			const commonPerCandidate = commonContext / 2; // ~487.5

			// Task 1: self1 + commonPerCandidate = 10 + 487.5 = 497.5
			// Task 2: self2 + commonPerCandidate = 15 + 487.5 = 502.5
			// Output per candidate = 100

			const result = splitTriageCosts(
				candidates,
				totalInputTokens,
				totalOutputTokens,
			);

			const task1 = result.find((r) => r.number === 1);
			assert.ok(task1);
			assert.strictEqual(
				task1.inputTokens,
				Math.round(self1 + commonPerCandidate),
			);
			assert.strictEqual(task1.outputTokens, 100);

			const task2 = result.find((r) => r.number === 2);
			assert.ok(task2);
			assert.strictEqual(
				task2.inputTokens,
				Math.round(self2 + commonPerCandidate),
			);
			assert.strictEqual(task2.outputTokens, 100);
		},
	);

	await t.test("should assign all costs to a single candidate", () => {
		const candidates = [{ number: 1, title: "Single", body: "1234" }];
		const result = splitTriageCosts(candidates, 1000, 200);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].number, 1);
		assert.strictEqual(result[0].inputTokens, 1000);
		assert.strictEqual(result[0].outputTokens, 200);
	});

	await t.test("should handle zero candidates", () => {
		const result = splitTriageCosts([], 1000, 200);
		assert.strictEqual(result.length, 0);
	});

	await t.test("should handle zero tokens", () => {
		const candidates = [{ number: 1, title: "Single", body: "" }];
		const result = splitTriageCosts(candidates, 0, 0);
		assert.strictEqual(result[0].inputTokens, 0);
		assert.strictEqual(result[0].outputTokens, 0);
	});

	await t.test("should handle candidates with no body", () => {
		const candidates = [
			{ number: 1, title: "A" }, // body is undefined
			{ number: 2, title: "B", body: "1234" },
		];
		const result = splitTriageCosts(candidates, 1000, 200);

		assert.strictEqual(result.length, 2);
		assert.ok(result.find((r) => r.number === 1).inputTokens > 0);
		assert.ok(result.find((r) => r.number === 2).inputTokens > 0);
	});
});
