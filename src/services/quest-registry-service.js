import { loadQuest, QUESTS } from "../content/quests/quests-data.js";

/**
 * @typedef {import("../content/quests/quest-types.js").Quest} Quest
 */

/**
 * Quest Registry Service
 *
 * Business logic for quest management.
 * Provides functions to query, filter, and validate quests.
 */

/**
 * Local cache for loaded quest data
 * @type {Record<string, Quest>}
 */
const questCache = {};

/**
 * Get quest metadata by ID
 * @param {string} questId - Quest identifier
 * @returns {Quest|undefined} Quest object (metadata or full data) or undefined if not found
 */
export function getQuest(questId) {
	return questCache[questId] || QUESTS[questId];
}

/**
 * Load full quest data including chapters
 * @param {string} questId
 * @returns {Promise<Quest|undefined>}
 */
export async function loadQuestData(questId) {
	const quest = await loadQuest(questId);
	if (quest) {
		questCache[questId] = quest;
	}
	return quest;
}

/**
 * Get all quests (metadata)
 * @returns {Quest[]} Array of all quests
 */
export function getAllQuests() {
	return Object.values(QUESTS);
}

/**
 * Check if a quest is locked based on prerequisites
 * @param {string} questId - Quest identifier
 * @param {Array<string>} completedQuests - Array of completed quest IDs
 * @returns {boolean} True if quest is locked, false otherwise
 */
export function isQuestLocked(questId, completedQuests = []) {
	const quest = getQuest(questId);
	if (!quest) return false;

	return (
		quest.prerequisites?.some((prereq) => !completedQuests.includes(prereq)) ??
		false
	);
}

/**
 * Get quests that are unlocked and available to play
 * @param {Array<string>} _completedQuests - Array of completed quest IDs (currently unused)
 * @returns {Quest[]} Array of available quests
 */
export function getAvailableQuests(_completedQuests = []) {
	return getAllQuests().filter((quest) => quest.status !== "coming-soon");
}

/**
 * Get quests that are coming soon
 * @returns {Quest[]} Array of coming soon quests
 */
export function getComingSoonQuests() {
	return getAllQuests().filter((quest) => quest.status === "coming-soon");
}
