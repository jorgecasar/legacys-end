import { getQuest, getAvailableQuests } from '../quests/quest-registry.js';
import { ProgressService } from '../services/progress-service.js';

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
			onQuestStart: () => { },
			onChapterChange: () => { },
			onQuestComplete: () => { },
			onReturnToHub: () => { },
			...options
		};

		this.progressService = this.options.progressService || new ProgressService();
		this.currentQuest = null;
		this.currentChapter = null;
		this.currentChapterIndex = 0;

		host.addController(this);
	}

	hostConnected() {
		// Restore current quest/chapter from progress
		const progress = this.progressService.getProgress();
		if (progress.currentQuest) {
			this.currentQuest = getQuest(progress.currentQuest);
			if (progress.currentChapter !== null) {
				this.currentChapterIndex = progress.currentChapter;
				this.currentChapter = this.getCurrentChapterData();
			}
		}
	}

	hostDisconnected() {
		// Save current state
		if (this.currentQuest) {
			this.progressService.setCurrentQuest(
				this.currentQuest.id,
				this.currentChapterIndex
			);
		}
	}

	/**
	 * Start a quest
	 * @param {string} questId - Quest ID to start
	 */
	startQuest(questId) {
		const quest = getQuest(questId);
		if (!quest) {
			console.error(`Quest not found: ${questId}`);
			return;
		}

		// Check if quest is available
		if (!this.progressService.isQuestAvailable(questId)) {
			console.warn(`Quest not available: ${questId}`);
			return;
		}

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
	resumeQuest() {
		if (!this.currentQuest) {
			// Try to load from progress service if not loaded yet
			const progress = this.progressService.getProgress();
			if (progress.currentQuest) {
				this.continueQuest(progress.currentQuest);
				return;
			}
		}

		if (!this.currentQuest) {
			console.warn('No quest to resume');
			return;
		}

		// Notify host
		this.options.onQuestStart(this.currentQuest);
		if (this.currentChapter) {
			this.options.onChapterChange(this.currentChapter, this.currentChapterIndex);
		}

		this.host.requestUpdate();
	}

	/**
	 * Continue a specific quest from the last uncompleted chapter
	 * @param {string} questId 
	 */
	continueQuest(questId) {
		const quest = getQuest(questId);
		if (!quest) {
			console.error(`Quest not found: ${questId}`);
			return;
		}

		// Find the first uncompleted chapter
		let nextChapterIndex = 0;
		if (quest.chapterIds) {
			for (let i = 0; i < quest.chapterIds.length; i++) {
				const chapterId = quest.chapterIds[i];
				const isCompleted = this.progressService.isChapterCompleted(chapterId);
				console.log(`🔍 Checking chapter ${i} (${chapterId}): ${isCompleted ? 'Completed' : 'Not Completed'}`);
				if (!isCompleted) {
					nextChapterIndex = i;
					break;
				}
			}
		}
		console.log(`▶️ Resuming quest ${questId} at chapter index ${nextChapterIndex}`);

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
		const { stats, ...restChapterData } = this.currentQuest.chapters ? this.currentQuest.chapters[chapterId] : {};

		if (!restChapterData) {
			console.warn(`Chapter data not found for ID: ${chapterId}`);
			return { id: chapterId }; // Fallback
		}

		return {
			...restChapterData,
			questId: this.currentQuest.id,
			index: this.currentChapterIndex,
			total: this.currentQuest.chapterIds.length,
			isQuestComplete: this.isLastChapter()
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

		const nextChapterId = this.currentQuest.chapterIds[this.currentChapterIndex + 1];
		const nextChapterData = this.currentQuest.chapters ? this.currentQuest.chapters[nextChapterId] : null;

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
			this.currentChapterIndex
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
		return getAvailableQuests(progress.completedQuests);
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
