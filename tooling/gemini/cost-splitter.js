/**
 * Estimates tokens from text length.
 * Rule of thumb: 1 token ≈ 4 characters
 * @param {string | undefined | null} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
	if (!text) return 0;
	return Math.ceil(text.length / 4);
}

/**
 * Splits the total cost of a multi-candidate triage operation proportionally.
 * @param {Array<Object>} candidates - List of issue candidates processed.
 * @param {number} totalInputTokens - Total input tokens for the entire operation.
 * @param {number} totalOutputTokens - Total output tokens for the entire operation.
 * @returns {Array<{number: number, inputTokens: number, outputTokens: number}>}
 */
export function splitTriageCosts(
	candidates,
	totalInputTokens,
	totalOutputTokens,
) {
	if (!candidates || candidates.length === 0) {
		return [];
	}

	if (candidates.length === 1) {
		return [
			{
				number: candidates[0].number,
				inputTokens: totalInputTokens,
				outputTokens: totalOutputTokens,
			},
		];
	}

	const candidatesWithTokens = candidates.map((c) => ({
		...c,
		// Estimate tokens for the JSON representation of the candidate
		selfTokens: estimateTokens(JSON.stringify(c)),
	}));

	const totalSelfTokens = candidatesWithTokens.reduce(
		(sum, c) => sum + c.selfTokens,
		0,
	);

	// The common context is what's left after accounting for the candidates themselves
	const commonContextTokens = Math.max(0, totalInputTokens - totalSelfTokens);

	const commonContextPerCandidate = commonContextTokens / candidates.length;
	const outputTokensPerCandidate = totalOutputTokens / candidates.length;

	return candidatesWithTokens.map((c) => {
		const finalInput = c.selfTokens + commonContextPerCandidate;

		return {
			number: c.number,
			inputTokens: Math.round(finalInput),
			outputTokens: Math.round(outputTokensPerCandidate),
		};
	});
}
