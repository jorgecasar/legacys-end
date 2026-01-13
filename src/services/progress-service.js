import { LocalStorageAdapter } from "./storage-service.js";

/** @typedef {import('./storage-service').StorageAdapter} StorageAdapter */

/**
 * @typedef {Object} ProgressStats
 * @property {number} totalPlayTime - Total time played in seconds
 * @property {number} questsCompleted - Number of quests finished
 * @property {number} chaptersCompleted - Number of chapters finished
 */

/**
 * @typedef {Object} ProgressState
 * @property {string[]} completedQuests - List of IDs of completed quests
 * @property {string[]} completedChapters - List of IDs of completed chapters
 * @property {string|null} currentQuest - ID of the active quest
 * @property {string|null} currentChapter - ID of the active chapter
 * @property {string[]} unlockedQuests - List of IDs of available quests
 * @property {string[]} achievements - List of earned achievement IDs
 * @property {ProgressStats} stats - Aggregate statistics
 * @property {Object.<string, Object>} chapterStates - Persisted state per chapter (e.g. collected items)
 */

/**
 * ProgressService - Manages player progress and persistence.
 * Tracks completed quests, chapters, achievements, and persistent chapter state.
 * Uses a StorageAdapter to save data to localStorage or other providers.
 */
export class ProgressService {
	/**
	 * @param {StorageAdapter} [storage] - Storage adapter for persistence
	 * @param {typeof import('../services/quest-registry-service.js')} [registry] - Quest registry
	 * @param {import('./logger-service.js').LoggerService} [logger] - Logger service
	 */
	constructor(
		storage = new LocalStorageAdapter(),
		registry = undefined,
		logger = undefined,
	) {
		if (!registry) throw new Error("Registry is required");
		this.storage = storage;
		this.registry =
			/** @type {typeof import('../services/quest-registry-service.js')} */ (
				registry
			);
		this.logger = logger;
		this.storageKey = "legacys-end-progress";
		/** @type {ProgressState} */
		this.progress = this.loadProgress() || this._getDefaultState();
	}

	/**
	 * @returns {ProgressState}
	 */
	_getDefaultState() {
		return {
			completedQuests: [],
			completedChapters: [],
			currentQuest: null,
			currentChapter: null,
			unlockedQuests: ["the-aura-of-sovereignty"],
			achievements: [],
			stats: {
				totalPlayTime: 0,
				questsCompleted: 0,
				chaptersCompleted: 0,
			},
			chapterStates: {},
		};
	}

	/**
	 * Load progress from storage.
	 * Returns default state if no storage is found.
	 * @returns {ProgressState|null} The loaded progress or null
	 */
	loadProgress() {
		const data = this.storage.getItem(this.storageKey);
		if (data) {
			this.logger?.info("💾 Loaded progress:", data);
			/** @type {ProgressState} */
			const typedData = /** @type {ProgressState} */ (data);
			return typedData;
		}

		// Default progress for new players
		this.logger?.info("🆕 Creating new progress");
		return null;
	}

	/**
	 * Save current progress state to storage.
	 */
	saveProgress() {
		this.logger?.info("💾 Saving progress:", this.progress);
		this.storage.setItem(this.storageKey, this.progress);
	}

	/**
	 * Reset progress to initial state.
	 * Clears storage and memory.
	 */
	resetProgress() {
		this.logger?.warn("⚠️ Resetting progress (Game Over / New Game)");
		this.progress = this._getDefaultState();
		// Re-unlock first quest explicitely if needed, but default state implies empty?
		// Actually the original code had: unlockedQuests: ["the-aura-of-sovereignty"]
		// Let's ensure default state has it or logic adds it.
		// Original default had: unlockedQuests: ["the-aura-of-sovereignty"]
		// My _getDefaultState has empty array. I should fix that to match original behavior if that was intended.
		// Looking at usage, setup-game probably unlocks it.
		// But let's check the original code from view_file.
		// It had: unlockedQuests: ["the-aura-of-sovereignty"], // First quest always unlocked
		// I will update _getDefaultState to include it.
		this.progress.unlockedQuests = ["the-aura-of-sovereignty"];
		this.saveProgress();
	}

	/**
	 * Reset progress for a specific quest.
	 * Used when restarting a quest.
	 * @param {string} questId
	 */
	resetQuestProgress(questId) {
		this.logger?.info(`🔄 Resetting progress for quest: ${questId}`);
		const quest = this.registry.getQuest(questId);

		// Remove chapters belonging to this quest
		if (quest?.chapterIds) {
			this.progress.completedChapters = this.progress.completedChapters.filter(
				(id) => !quest.chapterIds?.includes(id),
			);
			// Also clear chapter states (collected items, etc.)
			quest.chapterIds.forEach((chapterId) => {
				delete this.progress.chapterStates[chapterId];
			});
		} else {
			// Fallback to prefix matching if quest data not found (legacy behavior)
			this.progress.completedChapters = this.progress.completedChapters.filter(
				(id) => !id.startsWith(questId),
			);
		}

		this.progress.currentChapter = null; // Will start from beginning
		// Remove from completed quests if present
		this.progress.completedQuests = this.progress.completedQuests.filter(
			(id) => id !== questId,
		);

		if (this.progress.currentQuest === questId) {
			// quest lookup redundant here if we already looked it up above, but keeping structure similar
			// actually we already have 'quest' variable from above
			if (quest?.chapterIds && quest.chapterIds.length > 0) {
				// We don't necessarily set currentChapter here, the controller does.
				// But we clear the completed ones.
			}
			this.progress.currentChapter = null; // Will start from beginning
			this.progress.currentQuest = null;
		}
		this.saveProgress();
	}

	/**
	 * Update quest completion status.
	 * @param {string} questId
	 */
	completeQuest(questId) {
		if (!this.progress.completedQuests.includes(questId)) {
			this.progress.completedQuests.push(questId);
			this.progress.stats.questsCompleted++;

			// Create immutable copy of chapters to avoid concurrent modification issues during iteration
			const quest = this.registry.getQuest(questId);
			if (quest?.chapterIds) {
				quest.chapterIds.forEach((chapterId) => {
					if (!this.progress.completedChapters.includes(chapterId)) {
						this.progress.completedChapters.push(chapterId);
					}
				});
			}

			// Process rewards (achievements)
			if (quest?.reward?.badge) {
				this.unlockAchievement(quest.reward.badge);
			}

			this.unlockNewQuests();
			this.saveProgress();
			this.logger?.info(`✅ Quest completed: ${questId}`);
		}
	}

	/**
	 * Update chapter completion status.
	 * @param {string} chapterId
	 */
	completeChapter(chapterId) {
		if (!this.progress.completedChapters.includes(chapterId)) {
			this.progress.completedChapters.push(chapterId);
			this.progress.stats.chaptersCompleted++;
			this.checkQuestCompletion();
			this.saveProgress();
			this.logger?.info(`✅ Chapter completed: ${chapterId}`);
		}
	}

	/**
	 * Check if the current quest is completed (all chapters done).
	 */
	checkQuestCompletion() {
		const questId = this.progress.currentQuest;
		if (!questId) return;

		const quest = this.registry.getQuest(questId);
		if (!quest) return;

		const allChaptersDone = quest.chapterIds?.every((id) =>
			this.progress.completedChapters.includes(id),
		);

		if (allChaptersDone) {
			this.completeQuest(questId);
		}
	}

	/**
	 * Unlock an achievement.
	 * @param {string} achievementId
	 */
	unlockAchievement(achievementId) {
		if (!this.progress.achievements.includes(achievementId)) {
			this.progress.achievements.push(achievementId);
			this.saveProgress();
			this.logger?.info(`🏆 Achievement unlocked: ${achievementId}`);
		}
	}

	/**
	 * Unlock new quests based on prerequisites.
	 */
	unlockNewQuests() {
		const allQuests = this.registry.getAllQuests();
		for (const quest of allQuests) {
			if (this.progress.unlockedQuests.includes(quest.id)) continue;

			// Check prerequisites using registry service which handles the logic
			// The registry service's isQuestLocked returns true if ANY prerequisite is missing
			// So if it returns false, the quest is NOT locked (i.e., available)
			const isLocked = this.registry.isQuestLocked(
				quest.id,
				this.progress.completedQuests,
			);

			if (!isLocked) {
				this.progress.unlockedQuests.push(quest.id);
				this.logger?.info(`🔓 New quest unlocked: ${quest.id}`);
			}
		}
		this.saveProgress();
	}

	/**
	 * Set the currently active quest and chapter.
	 * @param {string} questId
	 * @param {string|null} [chapterId]
	 */
	setCurrentQuest(questId, chapterId = null) {
		this.progress.currentQuest = questId;
		this.progress.currentChapter = chapterId;
		this.saveProgress();
	}

	/**
	 * Check if a quest is available (unlocked).
	 * @param {string} questId
	 * @returns {boolean}
	 */
	isQuestAvailable(questId) {
		return this.progress.unlockedQuests.includes(questId);
	}

	/**
	 * Check if a quest is completed.
	 * @param {string} questId
	 * @returns {boolean}
	 */
	isQuestCompleted(questId) {
		return this.progress.completedQuests.includes(questId);
	}

	/**
	 * Check if a chapter is completed.
	 * @param {string} chapterId
	 * @returns {boolean}
	 */
	isChapterCompleted(chapterId) {
		return this.progress.completedChapters.includes(chapterId);
	}

	/**
	 * Get progress percentage for a quest.
	 * @param {string} questId
	 * @returns {number} 0-100
	 */
	getQuestProgress(questId) {
		if (this.isQuestCompleted(questId)) return 100;

		const quest = this.registry.getQuest(questId);
		if (!quest || !quest.chapterIds || quest.chapterIds.length === 0) return 0;

		const completedCount = quest.chapterIds.filter((id) =>
			this.isChapterCompleted(id),
		).length;
		return Math.round((completedCount / quest.chapterIds.length) * 100);
	}

	/**
	 * Get overall game completion progress.
	 * @returns {number} 0-100
	 */
	getOverallProgress() {
		const allQuests = this.registry.getAllQuests();
		if (allQuests.length === 0) return 0;

		const completedCount = allQuests.filter((q) =>
			this.isQuestCompleted(q.id),
		).length;
		const playableQuests = allQuests.filter(
			(q) => q.status !== "coming-soon",
		).length;

		if (playableQuests === 0) return 0;
		return Math.round((completedCount / playableQuests) * 100);
	}

	/**
	 * Get the entire progress state object.
	 * @returns {ProgressState}
	 */
	/**
	 * @param {keyof ProgressState} key
	 * @returns {any}
	 */
	getProperty(key) {
		return this.progress[key];
	}

	/**
	 * Get the entire progress state object.
	 * @returns {ProgressState}
	 */
	getProgress() {
		return JSON.parse(JSON.stringify(this.progress));
	}

	/**
	 * Update state for a specific chapter (e.g. collected items).
	 * @param {string} chapterId
	 * @param {Object} state
	 */
	updateChapterState(chapterId, state) {
		if (!this.progress.chapterStates) {
			this.progress.chapterStates = {};
		}
		if (!this.progress.chapterStates[chapterId]) {
			this.progress.chapterStates[chapterId] = {};
		}
		this.progress.chapterStates[chapterId] = {
			...this.progress.chapterStates[chapterId],
			...state,
		};
		this.saveProgress();
	}

	/**
	 * Get state for a specific chapter.
	 * @param {string} chapterId
	 * @returns {Object}
	 */
	getChapterState(chapterId) {
		return this.progress.chapterStates?.[chapterId] || {};
	}
}
