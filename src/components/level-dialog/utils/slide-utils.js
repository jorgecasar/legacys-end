import { LevelDialogSlideAnalysis } from "../slides/analysis/LevelDialogSlideAnalysis.js";
import { LevelDialogSlideCode } from "../slides/code/LevelDialogSlideCode.js";
import { LevelDialogSlideConfirmation } from "../slides/confirmation/LevelDialogSlideConfirmation.js";
import { LevelDialogSlideNarrative } from "../slides/narrative/LevelDialogSlideNarrative.js";
import { LevelDialogSlideProblem } from "../slides/problem/LevelDialogSlideProblem.js";

/**
 * @typedef {import('../../../content/quests/quest-types.js').LevelConfig} LevelConfig
 */

/**
 * Gets text for a specific slide type
 * @param {string} type
 * @param {LevelConfig} config
 * @returns {string}
 */
export function getSlideText(type, config) {
	if (!config) return "";

	switch (type) {
		case "narrative":
			return LevelDialogSlideNarrative.getAccessibilityText(config);
		case "problem":
			return LevelDialogSlideProblem.getAccessibilityText(config);
		case "code-start":
			return LevelDialogSlideCode.getAccessibilityText(config, "start");
		case "code-end":
			return LevelDialogSlideCode.getAccessibilityText(config, "end");
		case "analysis":
			return LevelDialogSlideAnalysis.getAccessibilityText(config);
		case "confirmation":
			return LevelDialogSlideConfirmation.getAccessibilityText(config);
		default:
			return "";
	}
}

/**
 * Builds the sequence of slides based on available config data
 * @param {LevelConfig} config
 * @returns {string[]} Array of slide type identifiers
 */
export function getSlides(config) {
	if (!config) return ["confirmation"];

	const sequence = [];
	if (config.description) {
		sequence.push("narrative");
	}
	if (config.codeSnippets?.start) {
		sequence.push("code-start");
	}
	if (config.problemDesc) {
		sequence.push("problem");
	}
	if (config.codeSnippets?.end) {
		sequence.push("code-end");
	}
	if (config.architecturalChanges && config.architecturalChanges.length > 0) {
		sequence.push("analysis");
	}
	sequence.push("confirmation");
	return sequence;
}
