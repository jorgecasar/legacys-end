/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { EVENTS } from "../constants/events.js";
import { eventBus } from "../core/event-bus.js";
import { ProgressService } from "../services/progress-service.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";

/**
 * @typedef {import("../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} Chapter
 *
 * @typedef {Object} QuestControllerOptions
 * @property {import('../services/progress-service.js').ProgressService} [progressService] - Progress tracking service
 * @property {typeof import('../services/quest-registry-service.js')} [registry] - Quest registry module
 * @property {import('../commands/command-bus.js').CommandBus} [commandBus] - Command bus
 * @property {import('../core/event-bus.js').EventBus} [eventBus] - Event bus
 * @property {import('../services/logger-service.js').LoggerService} [logger] - Logger
 * @property {EvaluateChapterTransitionUseCase} [evaluateChapterTransition] - Use case
 * @property {import('../services/preloader-service.js').PreloaderService} [preloaderService] - Preloader
 */

/**
 * QuestController - Orchestrates quest progression
 *
 * Handles:
 * - Quest selection and starting
 * - Chapter progression
 * - Quest completion
 * - Navigation between hub and quests
 *
 * @implements {ReactiveController}
 * @property {import('lit').ReactiveControllerHost} host
 * @property {QuestControllerOptions} options
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {Object} registry
 * @property {Object|null} currentQuest
 * @property {Object|null} currentChapter
 * @property {number} currentChapterIndex
 */
export class QuestController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<QuestControllerOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {QuestControllerOptions} */
		this.options = {
			progressService: undefined,
			registry: undefined,
			evaluateChapterTransition: new EvaluateChapterTransitionUseCase(),
			preloaderService: undefined,
			...options,
		};

		this.preloaderService = this.options.preloaderService;

		this.progressService =
			this.options.progressService ||
			new ProgressService(
				undefined,
				/** @type {any} */ (this.options.registry),
			);
		/** @type {import('../core/event-bus.js').EventBus} */
		this.eventBus = /** @type {any} */ (options).eventBus || eventBus;
		/** @type {import('../services/logger-service.js').LoggerService} */
		this.logger = /** @type {any} */ (options).logger;
		/** @type {typeof import('../services/quest-registry-service.js')} */
		this.registry = /** @type {any} */ (this.options.registry);

		if (!this.logger) throw new Error("Logger is required");
		if (!this.registry) throw new Error("Registry is required");
		/** @type {Quest|null} */
		this.currentQuest = null;
		/** @type {Chapter|null} */
		this.currentChapter = null;
		/** @type {number} */
		this.currentChapterIndex = 0;

		host.addController(this);
	}

	async hostConnected() {
		// Restore current quest/chapter from progress
		const progress = this.progressService.getProgress();
		if (progress.currentQuest) {
			const quest = await this.registry.loadQuestData(progress.currentQuest);
			if (quest) {
				this.currentQuest = quest;
				if (progress.currentChapter !== null) {
					// Convert chapter ID to index
					const chapterIndex =
						quest.chapterIds?.indexOf(progress.currentChapter) ?? -1;
					if (chapterIndex !== -1) {
						this.currentChapterIndex = chapterIndex;
						this.currentChapter = this.getCurrentChapterData();
						this.host.requestUpdate();
					}
				}
			}
		}
	}

	hostDisconnected() {
		// Save current state
		if (this.currentQuest) {
			const chapterId =
				this.currentQuest.chapterIds?.[this.currentChapterIndex] ?? null;
			this.progressService.setCurrentQuest(this.currentQuest.id, chapterId);
		}
	}

	/**
	 * Start a quest
	 * @param {string} questId - Quest ID to start
	 */
	async startQuest(questId) {
		const quest = await this.registry.loadQuestData(questId);
		if (!quest) {
			this.logger.error(`Quest not found: ${questId}`);
			return;
		}

		// Check if quest is available
		if (!this.progressService.isQuestAvailable(questId)) {
			this.logger.warn(`Quest not available: ${questId}`);
			return;
		}

		// Reset progress for this quest (handles restarts)
		this.progressService.resetQuestProgress(questId);

		this.currentQuest = quest;
		this.currentChapterIndex = 0;
		this.currentChapter = this.getCurrentChapterData();

		// Save progress
		const chapterId = quest.chapterIds?.[0] ?? null;
		this.progressService.setCurrentQuest(questId, chapterId);

		// Emit global event
		this.#emitQuestEvents({ started: true });

		this.host.requestUpdate();
	}

	/**
	 * Load a quest without resetting progress (for deep linking/routes)
	 * @param {string} questId
	 */
	async loadQuest(questId) {
		const quest = await this.registry.loadQuestData(questId);
		if (!quest) {
			this.logger.error(`Quest not found: ${questId}`);
			return false;
		}

		// Check if quest is available (unlocked)
		if (!this.progressService.isQuestAvailable(questId)) {
			this.logger.warn(`Quest not available: ${questId}`);
			return false;
		}

		// Ensure content is loaded

		this.currentQuest = quest;
		// Do not force chapter index to 0 here; let jumpToChapter handle it or default to 0
		// But we should probably ensure it's not null if it was null
		if (
			this.currentChapterIndex === null ||
			this.currentChapterIndex === undefined
		) {
			this.currentChapterIndex = 0;
		}

		this.currentChapter = this.getCurrentChapterData();

		// Emit global event
		this.#emitQuestEvents({ loaded: true });

		this.host.requestUpdate();
		return true;
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
			this.logger.warn("No quest to resume");
			return;
		}

		// Ensure content is loaded (if currentQuest was set but content missing)

		// Emit global event
		this.#emitQuestEvents({ resumed: true });

		this.host.requestUpdate();
	}

	/**
	 * Continue a specific quest from the last uncompleted chapter
	 * @param {string} questId
	 */
	async continueQuest(questId) {
		const quest = await this.registry.loadQuestData(questId);
		if (!quest) {
			this.logger.error(`Quest not found: ${questId}`);
			return;
		}

		// Find the first uncompleted chapter
		const nextChapterIndex = this.#findFirstUncompletedChapter(quest);
		this.logger.debug(
			`Resuming quest ${questId} at chapter index ${nextChapterIndex}`,
		);

		this.currentQuest = quest;
		this.currentChapterIndex = nextChapterIndex;
		this.currentChapter = this.getCurrentChapterData();

		// Save progress
		const chapterId = quest.chapterIds?.[nextChapterIndex] ?? null;
		this.progressService.setCurrentQuest(questId, chapterId);

		// Emit global event
		this.#emitQuestEvents({ continued: true });

		this.host.requestUpdate();
	}

	/**
	 * Jump to a specific chapter (for deep linking or debug)
	 * @param {string} chapterId
	 */
	jumpToChapter(chapterId) {
		if (!this.currentQuest) {
			this.logger.warn("Cannot jump to chapter: No active quest");
			return false;
		}

		// 1. Validate Chapter Exists
		const index = this.currentQuest.chapterIds?.indexOf(chapterId);
		if (index === -1 || index === undefined) {
			this.logger.warn(`Chapter not found: ${chapterId}`);
			return false;
		}

		// 2. Validate Sequential Progression
		// Use progress service for checking if previous chapters are done
		// We allow re-playing any completed chapter or the immediate next one.
		// Strict mode: can't skip ahead of unlocked progress.
		for (let i = 0; i < index; i++) {
			const prevChapterId = this.currentQuest.chapterIds?.[i];
			if (
				prevChapterId &&
				!this.progressService.isChapterCompleted(prevChapterId)
			) {
				this.logger.warn(
					`🚫 Cannot jump to ${chapterId}. Previous chapter ${prevChapterId} not completed.`,
				);
				return false;
			}
		}

		this.currentChapterIndex = index;
		this.currentChapter = this.getCurrentChapterData();

		// Update progress tracking
		const targetChapterId = this.currentQuest.chapterIds?.[index] ?? null;
		this.progressService.setCurrentQuest(this.currentQuest.id, targetChapterId);

		// Emit global event
		this.#emitQuestEvents({ jumped: true });
		this.host.requestUpdate();
		return true;
	}

	/**
	 * Get current chapter data
	 * @returns {Chapter|null} Full chapter data object
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
		const rawChapterData = this.currentQuest.chapters?.[chapterId];

		if (!rawChapterData) {
			this.logger.warn(`Chapter data not found for ID: ${chapterId}`);
			// @ts-expect-error
			return { id: chapterId }; // Fallback
		}

		const { stats: _stats, ...restChapterData } = rawChapterData;

		return /** @type {Chapter} */ ({
			...restChapterData,
			questId: this.currentQuest.id,
			index: this.currentChapterIndex,
			total: this.currentQuest.chapterIds.length,
			isQuestComplete: this.isLastChapter(),
		});
	}

	/**
	 * Get next chapter data without advancing
	 * @returns {Chapter|null} Next chapter data or null
	 */
	getNextChapterData() {
		if (!this.hasNextChapter()) {
			return null;
		}

		const nextChapterId =
			this.currentQuest?.chapterIds?.[this.currentChapterIndex + 1];
		const nextChapterData =
			this.currentQuest?.chapters && nextChapterId
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

		// Determine next step
		const result = this.options.evaluateChapterTransition?.execute({
			quest: this.currentQuest,
			currentIndex: this.currentChapterIndex,
		});

		if (!result) return;

		if (result.action === "ADVANCE") {
			this.nextChapter();
		} else if (result.action === "COMPLETE") {
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
		const chapterId =
			this.currentQuest?.chapterIds?.[this.currentChapterIndex] ?? null;
		this.progressService.setCurrentQuest(
			this.currentQuest?.id || "",
			chapterId || null,
		);

		// Emit global event
		this.eventBus.emit(EVENTS.QUEST.CHAPTER_CHANGED, {
			chapter: /** @type {Chapter} */ (this.currentChapter),
			index: this.currentChapterIndex,
		});

		// Preload next chapter assets
		if (this.preloaderService) {
			const nextChapterData = this.getNextChapterData();
			if (nextChapterData) {
				this.preloaderService.preloadChapter(nextChapterData);
			}
		}

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
		// Emit global event - consumers responsible for UI
		this.eventBus.emit(EVENTS.QUEST.COMPLETED, { quest: this.currentQuest });
	}

	/**
	 * Return to hub (quest selection screen)
	 */
	returnToHub() {
		this.currentQuest = null;
		this.currentChapter = null;
		this.currentChapterIndex = 0;

		// Clear current quest in progress
		this.progressService.setCurrentQuest(
			/** @type {string} */ (/** @type {unknown} */ (null)),
			null,
		);

		// Notify host
		// Emit global event
		this.eventBus.emit(EVENTS.QUEST.RETURN_TO_HUB);
		this.host.requestUpdate();
	}

	/**
	 * Get available quests for selection
	 * @returns {Quest[]} Available quests
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
	 * Get list of quests coming soon
	 * @returns {Array<import('../content/quests/quest-types.js').QuestData>}
	 */
	getComingSoonQuests() {
		return this.options.registry?.getComingSoonQuests() || [];
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
		return !!this.currentChapter?.exitZone;
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
	 * @param {string} levelId - Level ID to check
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
	 * @returns {string|null}
	 */
	getLastChapterId() {
		if (!this.currentQuest || !this.currentQuest.chapterIds) {
			return null;
		}
		const chapterIds = this.currentQuest.chapterIds;
		return chapterIds[chapterIds.length - 1];
	}

	/**
	 * Emits quest and chapter events
	 * @param {Object} additionalData - Additional data to include in QUEST.STARTED event
	 */
	#emitQuestEvents(additionalData = {}) {
		if (this.currentQuest) {
			this.eventBus.emit(EVENTS.QUEST.STARTED, {
				quest: this.currentQuest,
				...additionalData,
			});
		}

		if (this.currentChapter) {
			this.eventBus.emit(EVENTS.QUEST.CHAPTER_CHANGED, {
				chapter: this.currentChapter,
				index: this.currentChapterIndex,
			});
		}
	}

	/**
	 * Finds the first uncompleted chapter in a quest
	 * @param {Quest} quest - Quest to search
	 * @returns {number} Index of first uncompleted chapter
	 */
	#findFirstUncompletedChapter(quest) {
		if (!quest.chapterIds) {
			return 0;
		}

		for (let i = 0; i < quest.chapterIds.length; i++) {
			const chapterId = quest.chapterIds[i];
			if (!this.progressService.isChapterCompleted(chapterId)) {
				return i;
			}
		}

		return 0;
	}
}
