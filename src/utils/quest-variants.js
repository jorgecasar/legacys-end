/**
 * @typedef {import('../content/quests/quest-types.js').EnrichedQuest} EnrichedQuest
 */

/**
 * Gets the variant for a quest card based on its state
 * @param {EnrichedQuest} quest - The quest to get the variant for
 * @returns {"success" | "neutral" | "brand"} The variant name
 */
export function getQuestVariant(quest) {
	if (quest.isCompleted) return "success";
	if (quest.isLocked) return "neutral";
	return "brand";
}

/**
 * Gets the variant for a difficulty badge
 * @param {string} difficulty - The difficulty level
 * @returns {"success" | "warning" | "danger" | "neutral"} The variant name
 */
export function getDifficultyVariant(difficulty) {
	switch (difficulty.toLowerCase()) {
		case "beginner":
			return "success";
		case "intermediate":
			return "warning";
		case "advanced":
			return "danger";
		default:
			return "neutral";
	}
}
