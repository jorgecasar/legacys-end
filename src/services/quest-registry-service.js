import { QUESTS, QuestType } from "../content/quests/quests-data.js";

/**
 * Quest Registry Service
 * 
 * Business logic for quest management.
 * Provides functions to query, filter, and validate quests.
 */

/**
 * Get quest by ID
 * @param {string} questId - Quest identifier
 * @returns {Object|undefined} Quest object or undefined if not found
 */
export function getQuest(questId) {
	return QUESTS[questId];
}

/**
 * Get all quests of a specific type
 * @param {string} type - Quest type (from QuestType enum)
 * @returns {Array} Array of quests matching the type
 */
export function getQuestsByType(type) {
	return Object.values(QUESTS).filter((q) => q.type === type);
}

/**
 * Get all available quests (excluding hub)
 * @returns {Array} Array of all quest-type quests
 */
export function getAllQuests() {
	return getQuestsByType(QuestType.QUEST);
}

/**
 * Check if a quest is locked based on prerequisites
 * @param {string} questId - Quest identifier
 * @param {Array<string>} completedQuests - Array of completed quest IDs
 * @returns {boolean} True if quest is locked, false otherwise
 */
export function isQuestLocked(questId, completedQuests = []) {
	const quest = getQuest(questId);
	if (!quest || quest.type === QuestType.HUB) return false;

	return quest.prerequisites.some(
		(prereq) => !completedQuests.includes(prereq),
	);
}

/**
 * Get quests that are unlocked and available to play
 * @param {Array<string>} _completedQuests - Array of completed quest IDs (currently unused)
 * @returns {Array} Array of available quests
 */
export function getAvailableQuests(_completedQuests = []) {
	return getAllQuests().filter((quest) => quest.status !== "coming-soon");
}

/**
 * Get quests that are coming soon
 * @returns {Array} Array of coming soon quests
 */
export function getComingSoonQuests() {
	return getAllQuests().filter((quest) => quest.status === "coming-soon");
}
