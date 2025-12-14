import * as DefaultRegistry from "../quests/quest-registry.js";
import { logger } from "../services/logger-service.js";
import { ProgressService } from "../services/progress-service.js";

/**
 * QuestController - Orchestrates quest progression
 *
 * Handles:
 * - Quest selection and starting
 * - Chapter progression
 * - Quest completion
 * - Navigation between hub and quests
 *
 * Usage:
 * ```js
 * this.questController = new QuestController(this, {
 *   progressService: new ProgressService(),
 *   registry: QuestRegistry,
 *   onQuestStart: (quest) => { ... },
 *   onChapterChange: (chapter) => { ... },
 *   onQuestComplete: (quest) => { ... },
 *   onReturnToHub: () => { ... }
 * });
 * ```
 */
export class QuestController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			progressService: null,
			registry: DefaultRegistry,
			onQuestStart: (quest) => { },
			onChapterChange: (chapter, index) => { },
			onQuestComplete: (quest) => { },
			onReturnToHub: () => { },
			...options,
		};

		this.progressService =
			this.options.progressService || new ProgressService();
		this.registry = this.options.registry;
		this.currentQuest = null;
		this.currentChapter = null;
		this.currentChapterIndex = 0;

		host.addController(this);
	}

	hostConnected() {
		// Restore current quest/chapter from progress
		const progress = this.progressService.getProgress();
		if (progress.currentQuest) {
			const quest = this.registry.getQuest(progress.currentQuest);
			if (quest) {
				this.currentQuest = quest;
				// Load content asynchronously
				this._loadQuestContent(quest).then(() => {
					if (progress.currentChapter !== null) {
						this.currentChapterIndex = progress.currentChapter;
						this.currentChapter = this.getCurrentChapterData();
						this.host.requestUpdate();
					}
				});
			}
		}
	}

	async _loadQuestContent(quest) {
		if (quest.chapters) return;
		if (quest.loadChapters && typeof quest.loadChapters === "function") {
			try {
				quest.chapters = await quest.loadChapters();
			} catch (e) {
				logger.error(`Failed to load chapters for quest ${quest.id}:`, e);
			}
		}
	}

	hostDisconnected() {
		// Save current state
		if (this.currentQuest) {
			this.progressService.setCurrentQuest(
				this.currentQuest.id,
				this.currentChapterIndex,
			);
		}
	}

	/**
	 * Start a quest
	 * @param {string} questId - Quest ID to start
	 */
	async startQuest(questId) {
		const quest = this.registry.getQuest(questId);
		if (!quest) {
			logger.error(`Quest not found: ${questId}`);
			return;
		}

		// Check if quest is available
		if (!this.progressService.isQuestAvailable(questId)) {
			console.warn(`Quest not available: ${questId}`);
			return;
		}

		// Ensure content is loaded
		await this._loadQuestContent(quest);

		// Reset progress for this quest (handles restarts)
		this.progressService.resetQuestProgress(questId);

		this.currentQuest = quest;
		this.currentChapterIndex = 0;
		this.currentChapter = this.getCurrentChapterData();

		// Save progress
		this.progressService.setCurrentQuest(questId, 0);

		// Notify host
		this.options.onQuestStart(quest);
		if (this.currentChapter) {
			this.options.onChapterChange(this.currentChapter, 0);
		}

		this.host.requestUpdate();
	}

	/**
	 * Resume the currently active quest from saved state
	 */
	async resumeQuest() {
		if (!this.currentQuest) {
			// Try to load from progress service if not loaded yet
			const progress = this.progressService.getProgress();
			if (progress.currentQuest) {
				await this.continueQuest(progress.currentQuest);
				return;
			}
		}

		if (!this.currentQuest) {
			console.warn("No quest to resume");
			return;
		}

		// Ensure content is loaded (if currentQuest was set but content missing)
		await this._loadQuestContent(this.currentQuest);

		// Notify host
		this.options.onQuestStart(this.currentQuest);
		if (this.currentChapter) {
			this.options.onChapterChange(
				this.currentChapter,
				this.currentChapterIndex,
			);
		}

		this.host.requestUpdate();
	}

	/**
	 * Continue a specific quest from the last uncompleted chapter
	 * @param {string} questId
	 */
	async continueQuest(questId) {
		const quest = this.registry.getQuest(questId);
		if (!quest) {
			logger.error(`Quest not found: ${questId}`);
			return;
		}

		await this._loadQuestContent(quest);

		// Find the first uncompleted chapter
		let nextChapterIndex = 0;
		if (quest.chapterIds) {
			for (let i = 0; i < quest.chapterIds.length; i++) {
				const chapterId = quest.chapterIds[i];
				const isCompleted = this.progressService.isChapterCompleted(chapterId);
				console.log(
					`🔍 Checking chapter ${i} (${chapterId}): ${isCompleted ? "Completed" : "Not Completed"}`,
				);
				if (!isCompleted) {
					nextChapterIndex = i;
					break;
				}
			}
		}
		console.log(
			`▶️ Resuming quest ${questId} at chapter index ${nextChapterIndex}`,
		);

		this.currentQuest = quest;
		this.currentChapterIndex = nextChapterIndex;
		this.currentChapter = this.getCurrentChapterData();

		// Save progress
		this.progressService.setCurrentQuest(questId, nextChapterIndex);

		// Notify host
		this.options.onQuestStart(quest);
		if (this.currentChapter) {
			this.options.onChapterChange(this.currentChapter, nextChapterIndex);
		}

		this.host.requestUpdate();
	}

	/**
	 * Jump to a specific chapter (for deep linking or debug)
	 * @param {string} chapterId
	 */
	jumpToChapter(chapterId) {
		if (!this.currentQuest) {
			console.warn("Cannot jump to chapter: No active quest");
			return false;
		}

		// 1. Validate Chapter Exists
		const index = this.currentQuest.chapterIds?.indexOf(chapterId);
		if (index === -1 || index === undefined) {
			console.warn(`Chapter not found: ${chapterId}`);
			return false;
		}

		// 2. Validate Sequential Progression
		// Use progress service for checking if previous chapters are done
		// We allow re-playing any completed chapter or the immediate next one.
		// Strict mode: can't skip ahead of unlocked progress.
		for (let i = 0; i < index; i++) {
			const prevChapterId = this.currentQuest.chapterIds[i];
			if (!this.progressService.isChapterCompleted(prevChapterId)) {
				logger.warn(
					`🚫 Cannot jump to ${chapterId}. Previous chapter ${prevChapterId} not completed.`,
				);
				return false;
			}
		}

		this.currentChapterIndex = index;
		this.currentChapter = this.getCurrentChapterData();

		// Update progress tracking
		this.progressService.setCurrentQuest(this.currentQuest.id, index);

		// Notify host
		if (this.currentChapter) {
			this.options.onChapterChange(this.currentChapter, index);
		}
		this.host.requestUpdate();
		return true;
	}

	/**
	 * Get current chapter data
	 * @returns {Object|null} Full chapter data object
	 */
	getCurrentChapterData() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return null;
		}

		const chapterId = this.currentQuest.chapterIds[this.currentChapterIndex];
		if (chapterId === undefined) {
			return null;
		}

		// Fetch full chapter data from quest definition
		const { stats: _stats, ...restChapterData } = this.currentQuest.chapters
			? this.currentQuest.chapters[chapterId]
			: {};

		if (!restChapterData) {
			console.warn(`Chapter data not found for ID: ${chapterId}`);
			return { id: chapterId }; // Fallback
		}

		return {
			...restChapterData,
			questId: this.currentQuest.id,
			index: this.currentChapterIndex,
			total: this.currentQuest.chapterIds.length,
			isQuestComplete: this.isLastChapter(),
		};
	}

	/**
	 * Get next chapter data without advancing
	 * @returns {Object|null} Next chapter data or null
	 */
	getNextChapterData() {
		if (!this.hasNextChapter()) {
			return null;
		}

		const nextChapterId =
			this.currentQuest.chapterIds[this.currentChapterIndex + 1];
		const nextChapterData = this.currentQuest.chapters
			? this.currentQuest.chapters[nextChapterId]
			: null;

		return nextChapterData;
	}

	/**
	 * Complete current chapter and move to next
	 */
	completeChapter() {
		if (!this.currentQuest || !this.currentChapter) {
			return;
		}

		// Mark chapter as completed
		this.progressService.completeChapter(this.currentChapter.id);

		// Check if there are more chapters
		if (this.hasNextChapter()) {
			this.nextChapter();
		} else {
			this.completeQuest();
		}
	}

	/**
	 * Check if there is a next chapter
	 * @returns {boolean}
	 */
	hasNextChapter() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return false;
		}
		return this.currentChapterIndex < this.currentQuest.chapterIds.length - 1;
	}

	/**
	 * Move to next chapter
	 */
	nextChapter() {
		if (!this.hasNextChapter()) {
			return;
		}

		this.currentChapterIndex++;
		this.currentChapter = this.getCurrentChapterData();

		// Save progress
		this.progressService.setCurrentQuest(
			this.currentQuest.id,
			this.currentChapterIndex,
		);

		// Notify host
		this.options.onChapterChange(this.currentChapter, this.currentChapterIndex);
		this.host.requestUpdate();
	}

	/**
	 * Complete current quest
	 */
	completeQuest() {
		if (!this.currentQuest) {
			return;
		}

		// Mark quest as completed
		this.progressService.completeQuest(this.currentQuest.id);

		// Notify host - the host is responsible for calling returnToHub after any animations/messages
		this.options.onQuestComplete(this.currentQuest);
	}

	/**
	 * Return to hub (quest selection screen)
	 */
	returnToHub() {
		this.currentQuest = null;
		this.currentChapter = null;
		this.currentChapterIndex = 0;

		// Clear current quest in progress
		this.progressService.setCurrentQuest(null, null);

		// Notify host
		this.options.onReturnToHub();
		this.host.requestUpdate();
	}

	/**
	 * Get available quests for selection
	 * @returns {Array} Available quests
	 */
	getAvailableQuests() {
		const progress = this.progressService.getProgress();
		return this.registry.getAvailableQuests(progress.completedQuests);
	}

	/**
	 * Get quest progress percentage
	 * @param {string} questId
	 * @returns {number} Progress percentage (0-100)
	 */
	getQuestProgress(questId) {
		return this.progressService.getQuestProgress(questId);
	}

	/**
	 * Check if quest is completed
	 * @param {string} questId
	 * @returns {boolean}
	 */
	isQuestCompleted(questId) {
		return this.progressService.isQuestCompleted(questId);
	}

	/**
	 * Get overall game progress
	 * @returns {number} Progress percentage (0-100)
	 */
	getOverallProgress() {
		return this.progressService.getOverallProgress();
	}

	/**
	 * Reset all progress (for testing)
	 */
	resetProgress() {
		this.progressService.resetProgress();
		this.returnToHub();
	}

	/**
	 * Check if currently in a quest
	 * @returns {boolean}
	 */
	isInQuest() {
		return this.currentQuest !== null;
	}

	/**
	 * Check if currently in hub
	 * @returns {boolean}
	 */
	isInHub() {
		return this.currentQuest === null;
	}

	/**
	 * Check if current chapter is the last in the quest
	 * @returns {boolean}
	 */
	isLastChapter() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return false;
		}
		return this.currentChapterIndex === this.currentQuest.chapterIds.length - 1;
	}

	/**
	 * Check if current chapter has an exit zone
	 * (Last chapters typically don't have exit zones)
	 * @returns {boolean}
	 */
	hasExitZone() {
		return this.currentChapter && !!this.currentChapter.exitZone;
	}

	/**
	 * Get current chapter number (1-indexed for display)
	 * @returns {number}
	 */
	getCurrentChapterNumber() {
		return this.currentChapterIndex + 1;
	}

	/**
	 * Get total chapters in current quest
	 * @returns {number}
	 */
	getTotalChapters() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return 0;
		}
		return this.currentQuest.chapterIds.length;
	}

	/**
	 * Check if current chapter matches a specific level ID
	 * @param {number} levelId - Level ID to check
	 * @returns {boolean}
	 */
	isCurrentChapter(levelId) {
		if (!this.currentChapter) {
			return false;
		}
		return this.currentChapter.id === levelId;
	}

	/**
	 * Get the last chapter ID in current quest
	 * @returns {number|null}
	 */
	getLastChapterId() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return null;
		}
		const chapterIds = this.currentQuest.chapterIds;
		return chapterIds[chapterIds.length - 1];
	}
}
