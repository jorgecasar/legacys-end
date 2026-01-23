/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { Task, TaskStatus } from "@lit/task";
import { QuestStateService } from "../game/services/quest-state-service.js";

/**
 * @typedef {import("../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} Chapter
 * @typedef {import('../services/interfaces.js').IProgressService} IProgressService
 * @typedef {import('../game/interfaces.js').IQuestStateService} IQuestStateService
 * @typedef {import('../services/interfaces.js').ILoggerService} ILoggerService
 *
 * @typedef {Object} QuestControllerOptions
 * @property {IProgressService} progressService - Progress tracking service
 * @property {import('../services/quest-registry-service.js').QuestRegistryService} registry - Quest registry service
 *
 * @property {ILoggerService} logger - Logger
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} evaluateChapterTransition - Use case
 * @property {import('../services/preloader-service.js').PreloaderService | null} [preloaderService] - Preloader
 * @property {IQuestStateService} [state] - Quest state service
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
 * @property {IProgressService} progressService
 * @property {import('../services/quest-registry-service.js').QuestRegistryService} registry
 * @property {IQuestStateService} state
 * @property {import('../content/quests/quest-types.js').Quest | null} currentQuest
 * @property {import('../content/quests/quest-types.js').Chapter | null} currentChapter
 * @property {number} currentChapterIndex
 * @property {import('../services/preloader-service.js').PreloaderService | null} preloaderService
 */
export class QuestController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {QuestControllerOptions} options
	 */
	constructor(host, options) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {QuestControllerOptions} */
		this.options = options;

		// Validation of required dependencies
		if (!this.options.logger) throw new Error("Logger is required");
		if (!this.options.registry) throw new Error("Registry is required");
		if (!this.options.progressService)
			throw new Error("ProgressService is required");
		if (!this.options.evaluateChapterTransition)
			throw new Error("EvaluateChapterTransitionUseCase is required");

		// Assign dependencies
		this.logger = this.options.logger;
		this.registry = this.options.registry;
		this.progressService = this.options.progressService;
		this.evaluateChapterTransition = this.options.evaluateChapterTransition;
		this.preloaderService = this.options.preloaderService ?? null;

		// Instantiate state service or use injected
		this.state = this.options.state || new QuestStateService();

		/** @type {Quest|null} */
		this.currentQuest = null;
		/** @type {Chapter|null} */
		this.currentChapter = null;
		/** @type {number} */
		this.currentChapterIndex = 0;
		// Initialize Task for loading quest data
		this.loadQuestTask = new Task(this.host, {
			task: async ([questId], { signal: _signal }) => {
				if (!questId) return null;
				// Pass signal if registry supports it, or just load
				const quest = await this.registry.loadQuestData(questId);
				if (!quest) throw new Error(`Quest not found: ${questId}`);

				// Validate availability
				if (!this.progressService.isQuestAvailable(questId)) {
					throw new Error(`Quest not available: ${questId}`);
				}

				return quest;
			},
			args: () => [this._targetQuestId], // Reactive arg
		});

		/** @type {string|null} */
		this._targetQuestId = null;

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
		const start = performance.now();

		try {
			const success = await this.loadQuest(questId);
			const quest = this.loadQuestTask.value;

			if (!success || !quest) return false;

			const loadTime = Math.round(performance.now() - start);
			this.logger.debug(
				`[Perf] 📚 Loaded quest data for ${questId} in ${loadTime}ms`,
			);

			// Reset progress for this quest (handles restarts)
			this.progressService.resetQuestProgress(questId);

			this.currentChapterIndex = 0;
			this.currentChapter = this.getCurrentChapterData();

			// Save progress
			const chapterId = quest.chapterIds?.[0] ?? null;
			this.progressService.setCurrentQuest(questId, chapterId);

			// Update state service
			this._updateState();

			// Log memory usage if available
			if (
				window.performance &&
				/** @type {any} */ (window.performance).memory
			) {
				const mem = /** @type {any} */ (window.performance).memory;
				this.logger.debug(
					`[Perf] 🧠 Heap used: ${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB`,
				);
			}

			this.host.requestUpdate();
			return true;
		} catch (e) {
			this.logger.error("Failed to start quest", e);
			return false;
		}
	}

	/**
	 * Load a quest without resetting progress (for deep linking/routes)
	 * @param {string} questId
	 */
	async loadQuest(questId) {
		this._targetQuestId = questId;
		// Trigger update to run task
		this.host.requestUpdate();
		await this.host.updateComplete;

		// If task is async, updateComplete might strictly wait for render, but Task might still be pending?
		// @lit/task runs automatically.
		// We can await the task promise if we had access to it, or poll.
		// Actually, we can run the task function manually to get the promise?
		// No, `this.loadQuestTask.run()` returns a Promise.
		// NOTE: @lit/task 1.0 `run` method takes args.
		try {
			await this.loadQuestTask.run([questId]);
		} catch (e) {
			this.logger.error(`Failed to load Quest ${questId}`, e);
			return false;
		}

		if (this.loadQuestTask.status === TaskStatus.ERROR) {
			this.logger.error(
				`Quest not found or error: ${questId}`,
				this.loadQuestTask.error,
			);
			return false;
		}

		const quest = this.loadQuestTask.value;
		this.currentQuest = quest || null;

		// Do not force chapter index to 0 here; let jumpToChapter handle it or default to 0
		if (
			this.currentChapterIndex === null ||
			this.currentChapterIndex === undefined
		) {
			this.currentChapterIndex = 0;
		}

		this.currentChapter = this.getCurrentChapterData();

		// Update state service
		this._updateState();

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

		// Update state service
		this._updateState();

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

		// Update state service
		this._updateState();

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
		this.currentChapter = /** @type {Chapter | null} */ (
			this.currentQuest?.chapters?.[chapterId] || null
		);

		// Update progress tracking
		const targetChapterId = this.currentQuest.chapterIds?.[index] ?? null;
		this.progressService.setCurrentQuest(this.currentQuest.id, targetChapterId);

		// Update state service
		this._updateState();

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
		const rawChapterData = /** @type {Chapter | null} */ (
			this.currentQuest.chapters?.[chapterId] || null
		);

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

		return nextChapterData || null;
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

		// Update state service
		this._updateState();

		// Preload next chapter assets
		if (this.preloaderService) {
			const nextChapterData = this.getNextChapterData();
			if (nextChapterData) {
				this.logger.debug(
					`[Perf] 🚀 Triggering preload for next chapter: ${nextChapterData.id}`,
				);
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
	}

	/**
	 * Return to hub (quest selection screen)
	 * @returns {Promise<{success: boolean}>}
	 */
	async returnToHub() {
		this.currentQuest = null;
		this.currentChapter = null;
		this.currentChapterIndex = 0;

		// Clear current quest in progress
		this.progressService.setCurrentQuest(
			/** @type {string} */ (/** @type {unknown} */ (null)),
			null,
		);

		// Notify host

		this.host.requestUpdate();
		return { success: true };
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
		this.state.resetQuestState();
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
		return chapterIds[chapterIds.length - 1] || null;
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

		for (let i = 0; i < (quest.chapterIds?.length || 0); i++) {
			const chapterId = quest.chapterIds?.[i];
			if (chapterId && !this.progressService.isChapterCompleted(chapterId)) {
				return i;
			}
		}

		return 0;
	}

	/**
	 * Updates the quest state service with current values
	 */
	_updateState() {
		if (this.currentQuest) {
			this.state.setQuestTitle(this.currentQuest.name);
			this.state.setTotalChapters(this.currentQuest.chapterIds?.length || 0);
		}
		this.state.setCurrentChapterNumber(this.currentChapterIndex + 1);
		this.state.setCurrentChapterId(this.currentChapter?.id || null);
		this.state.setLevelTitle(this.currentChapter?.title || "");
	}
}
