#!/usr/bin/env node
/**
 * Gemini with Intelligent Fallback
 *
 * Executes Gemini API calls with automatic fallback to cheaper/alternative models
 * on rate limits or unavailability.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_PRICING, MODEL_FALLBACK } from "./gemini-pricing.js";

/**
 * @typedef {Object} GeminiResult
 * @property {string} text - Generated text
 * @property {string} modelUsed - Model that was actually used
 * @property {number} inputTokens - Input tokens consumed
 * @property {number} outputTokens - Output tokens consumed
 * @property {Object} pricing - Pricing info for the model used
 */

/**
 * Run Gemini with intelligent fallback
 *
 * @param {'flash'|'pro'|'image'} modelType - Model type to use
 * @param {string} prompt - Prompt text
 * @param {Object} [options] - Options
 * @param {string} [options.apiKey] - Gemini API key (defaults to GEMINI_API_KEY env var)
 * @param {number} [options.maxRetries=3] - Max retries per model
 * @returns {Promise<GeminiResult>} Result with model used and token counts
 *
 * @example
 * const result = await runWithFallback('flash', 'Analyze this issue...');
 * console.log(`Used ${result.modelUsed}, cost: $${result.cost}`);
 */
export async function runWithFallback(modelType, prompt, options = {}) {
	const { apiKey = process.env.GEMINI_API_KEY, maxRetries = 3 } = options;

	if (!apiKey) {
		throw new Error(
			"GEMINI_API_KEY environment variable or apiKey option required",
		);
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const models = MODEL_FALLBACK[modelType];

	if (!models || models.length === 0) {
		throw new Error(
			`Unknown model type: ${modelType}. Available types: ${Object.keys(MODEL_FALLBACK).join(", ")}`,
		);
	}

	let lastError;

	for (const modelName of models) {
		console.log(
			`Trying model: ${modelName} (${GEMINI_PRICING[modelName]?.tier || "unknown"})`,
		);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const model = genAI.getGenerativeModel({ model: modelName });
				const result = await model.generateContent(prompt);
				const response = result.response;

				// Extract usage metadata
				const usage = response.usageMetadata || {};
				const inputTokens = usage.promptTokenCount || 0;
				const outputTokens = usage.candidatesTokenCount || 0;

				console.log(
					`✅ Success with ${modelName} (attempt ${attempt}/${maxRetries}): ${inputTokens} input + ${outputTokens} output tokens`,
				);

				return {
					text: response.text(),
					modelUsed: modelName,
					inputTokens,
					outputTokens,
					pricing: GEMINI_PRICING[modelName],
				};
			} catch (err) {
				lastError = err;
				console.error(
					`❌ ${modelName} failed (attempt ${attempt}/${maxRetries}):`,
					err.message,
				);

				// Check if we should retry or move to next model
				const isRateLimit =
					err.message?.includes("429") || err.message?.includes("quota");
				const isUnavailable =
					err.message?.includes("unavailable") ||
					err.message?.includes("not found");

				if (isRateLimit || isUnavailable) {
					// Don't retry this model, move to next
					console.log(
						`Skipping to next model due to: ${isRateLimit ? "rate limit" : "unavailability"}`,
					);
					break;
				}

				// For other errors, retry same model
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * 2 ** (attempt - 1), 10000); // Exponential backoff
					console.log(`Retrying in ${delay}ms...`);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}
	}

	throw new Error(
		`All fallback models failed for ${modelType}. Last error: ${lastError?.message || "Unknown error"}`,
	);
}

/**
 * Count tokens for a given prompt using the fastest model
 *
 * @param {string} prompt - Prompt text
 * @param {Object} [options] - Options
 * @returns {Promise<number>} Token count
 */
export async function countTokens(prompt, options = {}) {
	const { apiKey = process.env.GEMINI_API_KEY } = options;
	if (!apiKey) return 0;

	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
		const { totalTokens } = await model.countTokens(prompt);
		return totalTokens;
	} catch (error) {
		console.warn("Failed to count tokens accurately:", error.message);
		return Math.ceil(prompt.length / 4); // Fallback estimation
	}
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
	const [modelType, ...promptParts] = process.argv.slice(2);
	const prompt = promptParts.join(" ");

	if (!modelType || !prompt) {
		console.error(
			"Usage: node gemini-with-fallback.js <flash|pro|image> <prompt>",
		);
		process.exit(1);
	}

	runWithFallback(modelType, prompt)
		.then((result) => {
			console.log("\n📊 Result:");
			console.log(`Model: ${result.modelUsed}`);
			console.log(`Input tokens: ${result.inputTokens}`);
			console.log(`Output tokens: ${result.outputTokens}`);
			console.log(`\n${result.text}`);
		})
		.catch((error) => {
			console.error("❌ Error:", error.message);
			process.exit(1);
		});
}
