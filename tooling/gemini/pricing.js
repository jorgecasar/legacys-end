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
 * Official Gemini pricing table (Price per 1M tokens)
 * @type {Record<string, ModelPricing>}
 */
export const GEMINI_PRICING = {
	"gemini-1.5-flash": {
		input: 0.075,
		output: 0.3,
		tier: "production",
	},
	"gemini-1.5-pro": {
		input: 1.25,
		inputTier2: 2.5,
		output: 5.0,
		outputTier2: 10.0,
		tier: "production",
	},
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
		inputTier2: 2.5,
		output: 10.0,
		outputTier2: 15.0,
		tier: "production",
	},
	"gemini-3-flash-preview": {
		input: 0.5,
		output: 3.0,
		tier: "preview",
	},
	"gemini-3-pro-preview": {
		input: 2.0,
		inputTier2: 4.0,
		output: 12.0,
		outputTier2: 18.0,
		tier: "preview",
	},
};

/**
 * Model fallback chains ordered by cost (cheapest first)
 * @type {Record<string, string[]>}
 */
export const MODEL_FALLBACK = {
	flash: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
	pro: ["gemini-2.5-pro", "gemini-2.0-flash"],
	image: ["gemini-2.0-flash"],
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
 * @param {string} model - Model name (e.g., 'gemini-2.5-pro')
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {CostCalculation} Cost breakdown
 * @throws {Error} If model is unknown
 */
export function calculateCost(model, inputTokens, outputTokens) {
	let pricing = GEMINI_PRICING[model];
	if (!pricing) {
		console.warn(
			`Unknown model: ${model}. Using gemini-2.5-flash-lite pricing.`,
		);
		pricing = GEMINI_PRICING["gemini-2.5-flash-lite"];
	}

	const threshold = 200_000;
	const isTier2 = inputTokens > threshold;

	const inputRate =
		isTier2 && pricing.inputTier2 ? pricing.inputTier2 : pricing.input;
	const outputRate =
		isTier2 && pricing.outputTier2 ? pricing.outputTier2 : pricing.output;

	const inputCost = (inputTokens / 1_000_000) * inputRate;
	const outputCost = (outputTokens / 1_000_000) * outputRate;

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

/**
 * Normalizes a model name to its base category (flash, pro, image).
 * @param {string} model - The model name or category to normalize.
 * @returns {string} Normalized category ('flash', 'pro', or 'image').
 */
export function normalizeModel(model) {
	const lower = (model || "flash").toLowerCase();
	if (lower.includes("pro")) return "pro";
	if (lower.includes("image")) return "image";
	return "flash";
}
