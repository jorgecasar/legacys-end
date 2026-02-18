/**
 * @typedef {import("../types/quests.d.js").Quest} Quest
 */

import { getQuests, loadQuest } from "../content/quests/quests-data.js";
import { getAvailableQuests } from "../use-cases/get-available-quests.js";
import { getComingSoonQuests } from "../use-cases/get-coming-soon-quests.js";

/**
 * Quest Registry Service
 *
 * Business logic for quest management.
 * Provides functions to query, filter, and validate quests.
 */
export class QuestRegistryService {
	constructor() {
		/**
		 * Local cache for loaded quest data (full quests with chapters)
		 * @type {Record<string, Quest>}
		 */
		this.questCache = {};
	}

	/**
	 * Get quest metadata by ID
	 * @param {string} questId - Quest identifier
	 * @returns {Quest|undefined} Quest object (metadata or full data) or undefined if not found
	 */
	getQuest(questId) {
		// Priority: Full quest data (if loaded meta matches current locale)
		// For Phase 1, we focus on metadata.
		return this.questCache[questId] || getQuests()[questId];
	}

	/**
	 * Load full quest data including chapters
	 * @param {string} questId
	 * @returns {Promise<Quest|undefined>}
	 */
	async loadQuestData(questId) {
		const quest = await loadQuest(questId);
		if (quest) {
			this.questCache[questId] = quest;
		}
		return quest;
	}

	/**
	 * Check if a quest is locked based on prerequisites
	 * @param {string} questId - Quest identifier
	 * @param {Array<string>} completedQuests - Array of completed quest IDs
	 * @returns {boolean} True if quest is locked, false otherwise
	 */
	isQuestLocked(questId, completedQuests = []) {
		const quest = this.getQuest(questId);
		if (!quest) return false;

		return (
			quest.prerequisites?.some(
				(prereq) => !completedQuests.includes(prereq),
			) ?? false
		);
	}

	/**
	 * Invalidate quest cache (to force reload in new language)
	 */
	invalidateQuestCache() {
		Object.keys(this.questCache).forEach((key) => {
			delete this.questCache[key];
		});
	}
}
