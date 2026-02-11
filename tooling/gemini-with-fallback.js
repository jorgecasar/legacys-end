#!/usr/bin/env node
/**
 * Gemini with Intelligent Fallback and Structured Output
 *
 * Executes Gemini API calls using the new @google/genai SDK with automatic
 * fallback to cheaper/alternative models and support for JSON Schema.
 */

import { createClient } from "@google/genai";
import { GEMINI_PRICING, MODEL_FALLBACK } from "./gemini-pricing.js";

/**
 * @typedef {Object} GeminiResult
 * @property {any} data - Generated data (parsed JSON if schema provided, otherwise string)
 * @property {string} text - Raw generated text
 * @property {string} modelUsed - Model that was actually used
 * @property {number} inputTokens - Input tokens consumed
 * @property {number} outputTokens - Output tokens consumed
 * @property {Object} pricing - Pricing info for the model used
 */

/**
 * Run Gemini with intelligent fallback and optional structured output
 *
 * @param {'flash'|'pro'|'image'} modelType - Model type to use
 * @param {string} prompt - Prompt text
 * @param {Object} [options] - Options
 * @param {string} [options.apiKey] - Gemini API key
 * @param {number} [options.maxRetries=3] - Max retries per model
 * @param {Object} [options.responseSchema] - JSON Schema for structured output
 * @returns {Promise<GeminiResult>} Result with model used and token counts
 */
export async function runWithFallback(modelType, prompt, options = {}) {
	const {
		apiKey = process.env.GEMINI_API_KEY,
		maxRetries = 3,
		responseSchema,
	} = options;

	if (!apiKey) {
		throw new Error("GEMINI_API_KEY required");
	}

	const client = createClient({ apiKey });
	const models = MODEL_FALLBACK[modelType];

	let lastError;

	for (const modelName of models) {
		console.log(`Trying model: ${modelName}`);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const config = {
					model: modelName,
				};

				// Configure structured output if schema provided
				if (responseSchema) {
					config.generationConfig = {
						responseMimeType: "application/json",
						responseSchema: responseSchema,
					};
				}

				const result = await client.models.generateContent({
					model: modelName,
					contents: [{ role: "user", parts: [{ text: prompt }] }],
					config: config.generationConfig,
				});

				// New SDK structure for usage metadata
				const usage = result.usageMetadata || {};
				const inputTokens = usage.promptTokenCount || 0;
				const outputTokens = usage.candidatesTokenCount || 0;

				console.log(
					`✅ Success with ${modelName} (${inputTokens} in / ${outputTokens} out)`,
				);

				let data = result.text;
				if (responseSchema) {
					try {
						data = JSON.parse(result.text);
					} catch (e) {
						console.warn(
							"Failed to parse structured output, returning raw text.",
						);
					}
				}

				return {
					data,
					text: result.text,
					modelUsed: modelName,
					inputTokens,
					outputTokens,
					pricing: GEMINI_PRICING[modelName],
				};
			} catch (err) {
				lastError = err;
				console.error(
					`❌ ${modelName} failed (attempt ${attempt}):`,
					err.message,
				);

				const isRateLimit =
					err.message?.includes("429") || err.message?.includes("quota");
				if (isRateLimit) break; // Skip to next model

				if (attempt < maxRetries) {
					await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
				}
			}
		}
	}

	throw new Error(`All models failed. Last error: ${lastError?.message}`);
}
