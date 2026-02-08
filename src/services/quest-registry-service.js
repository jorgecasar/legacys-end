/**
 * @typedef {import("../types/quests.d.js").Quest} Quest
 */

import { getQuests, loadQuest } from "../content/quests/quests-data.js";
import { QuestValidator } from "../utils/validators.js"; // New import
import { Result } from "../utils/result.js"; // New import

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
	 * Load full quest data including chapters and validate it.
	 * @param {string} questId
	 * @returns {Promise<Result<Quest, import("../utils/validators.js").ValidationError[]>>}
	 */
	async loadQuestData(questId) {
		const quest = await loadQuest(questId);
		if (!quest) {
			return Result.Err([
				{
					field: "questId",
					message: `Quest with ID '${questId}' not found.`,
					value: questId,
				},
			]);
		}

		const validationResult = QuestValidator.validateResult(quest);

		if (validationResult.isOk()) {
			this.questCache[questId] = validationResult.value;
		}
		// Returns Result.Ok(quest) if valid, or Result.Err(errors) if invalid.
		return validationResult;
	}

	/**
	 * Get all quests (metadata)
	 * @returns {Quest[]} Array of all quests
	 */
	getAllQuests() {
		return Object.values(getQuests());
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
	 * Get quests that are unlocked and available to play
	 * @param {Array<string>} _completedQuests - Array of completed quest IDs (currently unused)
	 * @returns {Quest[]} Array of available quests
	 */
	getAvailableQuests(_completedQuests = []) {
		return this.getAllQuests().filter(
			(quest) => quest.status !== "coming_soon",
		);
	}

	/**
	 * Get quests that are coming soon
	 * @returns {Quest[]} Array of coming soon quests
	 */
	getComingSoonQuests() {
		return this.getAllQuests().filter(
			(quest) => quest.status === "coming_soon",
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
