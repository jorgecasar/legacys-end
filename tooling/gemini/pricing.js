/**
 * Gemini API Pricing Table and Cost Calculator
 *
 * Prices are in USD per 1 million tokens.
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 */

/**
 * @typedef {Object} ModelPricing
 * @property {number} input - Price per 1M input tokens (USD)
 * @property {number} output - Price per 1M output tokens (USD)
 * @property {'production'|'preview'} tier - Model tier
 */

/**
 * Official Gemini pricing table
 * @type {Record<string, ModelPricing>}
 */
export const GEMINI_PRICING = {
	"gemini-2.5-flash-lite": {
		input: 0.1,
		output: 0.4,
		tier: "production",
	},
	"gemini-2.5-flash": {
		input: 0.3,
		output: 2.5,
		tier: "production",
	},
	"gemini-2.5-pro": {
		input: 1.25,
		output: 10.0,
		tier: "production",
	},
	"gemini-3-flash-preview": {
		input: 0.5,
		output: 3.0,
		tier: "preview",
	},
	"gemini-3-pro-preview": {
		input: 2.0,
		output: 12.0,
		tier: "preview",
	},
};

/**
 * Model fallback chains ordered by cost (cheapest first)
 * @type {Record<string, string[]>}
 */
export const MODEL_FALLBACK = {
	flash: [
		"gemini-2.5-flash-lite",
		"gemini-2.5-flash",
		"gemini-3-flash-preview",
	],
	pro: ["gemini-2.5-pro", "gemini-3-pro-preview"],
	image: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro-preview"],
};

/**
 * @typedef {Object} CostCalculation
 * @property {number} inputCost - Cost of input tokens (USD)
 * @property {number} outputCost - Cost of output tokens (USD)
 * @property {number} totalCost - Total cost (USD)
 * @property {string} model - Model name
 * @property {number} inputTokens - Number of input tokens
 * @property {number} outputTokens - Number of output tokens
 */

/**
 * Calculate cost for a Gemini API call
 *
 * @param {string} model - Model name (e.g., 'gemini-2.5-flash-lite')
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {CostCalculation} Cost breakdown
 * @throws {Error} If model is unknown
 *
 * @example
 * const cost = calculateCost('gemini-2.5-flash-lite', 250, 50);
 * console.log(cost.totalCost); // 0.000016875 USD
 */
export function calculateCost(model, inputTokens, outputTokens) {
	const pricing = GEMINI_PRICING[model];
	if (!pricing) {
		throw new Error(
			`Unknown model: ${model}. Available models: ${Object.keys(GEMINI_PRICING).join(", ")}`,
		);
	}

	const inputCost = (inputTokens / 1_000_000) * pricing.input;
	const outputCost = (outputTokens / 1_000_000) * pricing.output;

	return {
		inputCost,
		outputCost,
		totalCost: inputCost + outputCost,
		model,
		inputTokens,
		outputTokens,
	};
}

/**
 * Estimate tokens from text length
 * Rule of thumb: 1 token ≈ 4 characters
 *
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
	return Math.ceil(text.length / 4);
}

/**
 * Get the cheapest model in a fallback chain
 *
 * @param {'flash'|'pro'|'image'} modelType - Model type
 * @returns {string} Cheapest model name
 */
export function getCheapestModel(modelType) {
	const chain = MODEL_FALLBACK[modelType];
	if (!chain || chain.length === 0) {
		throw new Error(`Unknown model type: ${modelType}`);
	}
	return chain[0];
}
