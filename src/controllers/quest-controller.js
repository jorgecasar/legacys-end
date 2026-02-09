import { ContextConsumer } from "@lit/context";
import { Task } from "@lit/task";
import { ServiceType } from "../content/quests/quest-types.js";
import { loggerContext } from "../contexts/logger-context.js";
import { preloaderContext } from "../contexts/preloader-context.js";
import { progressContext } from "../contexts/progress-context.js";
import { questRegistryContext } from "../contexts/quest-registry-context.js";
import { sessionContext } from "../contexts/session-context.js";
import { HotSwitchStates } from "../core/constants.js";
import { gameStoreContext } from "../core/store.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";

/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import('lit').ReactiveElement} ReactiveElement
 *
 * @typedef {import("../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} Chapter
 * @typedef {import('../types/services.d.js').IProgressService} IProgressService
 * @typedef {import('../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/game.d.js').IWorldStateService} IWorldStateService
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/services.d.js').ISessionService} ISessionService
 * @typedef {import('../services/quest-registry-service.js').QuestRegistryService} QuestRegistryService
 * @typedef {import('../services/preloader-service.js').PreloaderService} PreloaderService
 * @typedef {import('../utils/router.js').Router} Router
 * @typedef {import('../types/services.d.js').QuestResult} QuestResult
 * @typedef {import('../types/services.d.js').EnrichedChapter} EnrichedChapter
 */

/**
 * @typedef {Object} QuestControllerOptions
 * @property {ILoggerService} [logger]
 * @property {QuestRegistryService} [registry]
 * @property {IProgressService} [progressService]
 * @property {PreloaderService} [preloaderService]
 * @property {IQuestStateService} [state]
 * @property {ISessionService} [sessionService]
 * @property {IWorldStateService} [worldState]
 * @property {IHeroStateService} [heroState]
 * @property {Router} [router]
 * @property {EvaluateChapterTransitionUseCase} [evaluateChapterTransition]
 */

/**
 * QuestController - Orchestrates quest progression
 *
 * @implements {ReactiveController}
 */
export class QuestController {
	/** @type {ILoggerService | null} */
	#logger = null;
	/** @type {QuestRegistryService | null} */
	#registry = null;
	/** @type {IProgressService | null} */
	#progressService = null;
	/** @type {PreloaderService | null} */
	#preloaderService = null;
	/** @type {IQuestStateService | null} */
	#state = null;
	/** @type {ISessionService | null} */
	#sessionService = null;
	/** @type {IWorldStateService | null} */
	#worldState = null;
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {Router | null} */
	#router = null;

	#isAdvancingChapter = false;

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {QuestControllerOptions} [options]
	 */
	constructor(host, options = {}) {
		this.host = host;
		this.#logger = options.logger || null;
		this.#registry = options.registry || null;
		this.#progressService = options.progressService || null;
		this.#preloaderService = options.preloaderService || null;
		this.#state = options.state || null;
		this.#sessionService = options.sessionService || null;
		this.#worldState = options.worldState || null;
		this.#heroState = options.heroState || null;
		this.#router = options.router || null;

		const hostElement = /** @type {ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Consumed services via context (only if not already provided)
		this.#setupContexts(hostElement);

		// Use case
		this.evaluateChapterTransition =
			options.evaluateChapterTransition ||
			new EvaluateChapterTransitionUseCase();

		/** @type {Quest|null} */
		this.currentQuest = null;
		/** @type {Chapter|null} */
		this.currentChapter = null;
		/** @type {number} */
		this.currentChapterIndex = 0;

		// Initialize Task for loading quest data
		this.loadQuestTask = new Task(this.host, {
			/**
			 * @param {[string]} args
			 * @param {{signal: AbortSignal}} options
			 */
			task: async ([questId], { signal: _signal }) => {
				if (!questId || !this.#registry || !this.#progressService) return null;

				const quest = await this.#registry.loadQuestData(questId);
				if (!quest || !this.#progressService.isQuestAvailable(questId)) {
					return null;
				}

				this.currentQuest = quest;
				this.#syncWithProgress();
				this.#updateState();
				this.host.requestUpdate();

				return quest;
			},
		});

		this.host.addController(this);
	}

	/**
	 * @param {ReactiveElement} hostElement
	 */
	#setupContexts(hostElement) {
		if (!this.#logger) {
			new ContextConsumer(hostElement, {
				context: loggerContext,
				subscribe: true,
				callback: (service) => {
					this.#logger = /** @type {ILoggerService} */ (service);
				},
			});
		}

		if (!this.#registry) {
			new ContextConsumer(hostElement, {
				context: questRegistryContext,
				subscribe: true,
				callback: (service) => {
					this.#registry = /** @type {QuestRegistryService} */ (service);
				},
			});
		}

		if (!this.#progressService) {
			new ContextConsumer(hostElement, {
				context: progressContext,
				subscribe: true,
				callback: (service) => {
					this.#progressService = /** @type {IProgressService} */ (service);
				},
			});
		}

		if (!this.#preloaderService) {
			new ContextConsumer(hostElement, {
				context: preloaderContext,
				subscribe: true,
				callback: (service) => {
					this.#preloaderService = /** @type {PreloaderService} */ (service);
				},
			});
		}

		if (!this.#state || !this.#worldState || !this.#heroState) {
			new ContextConsumer(hostElement, {
				context: gameStoreContext,
				subscribe: true,
				callback: (store) => {
					if (store) {
						this.#state = store.quest;
						this.#worldState = store.world;
						this.#heroState = store.hero;
					}
				},
			});
		}

		if (!this.#sessionService) {
			new ContextConsumer(hostElement, {
				context: sessionContext,
				subscribe: true,
				callback: (service) => {
					this.#sessionService = /** @type {ISessionService} */ (service);
				},
			});
		}
	}

	hostConnected() {}

	hostDisconnected() {}

	/**
	 * Start a new quest
	 * @param {string} questId
	 * @returns {Promise<QuestResult>}
	 */
	async startQuest(questId) {
		if (!this.#progressService || !this.#sessionService) {
			return {
				success: false,
				quest: null,
				error: new Error("Missing services"),
			};
		}

		this.#setLoadingState(true);
		this.#state?.resetQuestState();
		this.#worldState?.setPaused(false);
		this.#worldState?.setShowDialog(false);
		this.#worldState?.resetSlideIndex();

		try {
			this.#progressService.resetQuestProgress(questId);
			const success = await this.loadQuest(questId);
			if (!success || !this.currentQuest) {
				this.#setLoadingState(false);
				return {
					success: false,
					quest: null,
					error: new Error("Quest load failed"),
				};
			}

			// Sync with progress
			this.#progressService.setCurrentQuest(questId, null);
			this.currentChapterIndex = 0;
			this.currentChapter = this.#getChapterByIndex(0);

			if (this.currentChapter) {
				this.#progressService.setCurrentQuest(questId, this.currentChapter.id);
				this.#sessionService.setCurrentQuest(this.currentQuest);
				this.#sessionService.setIsInHub(false);
				this.#updateState();
				this.#preloadNextChapters();
				this.#syncHeroState(this.currentChapter);

				if (this.#router) {
					this.#router.navigate(
						`/quest/${questId}/chapter/${this.currentChapter.id}`,
					);
				}
			}

			this.#setLoadingState(false);
			this.#logger?.info(`🎮 Started quest: ${this.currentQuest.name}`);
			this.host.requestUpdate();
			return { success: true, quest: this.currentQuest };
		} catch (error) {
			this.#logger?.error("Failed to start quest:", error);
			this.#setLoadingState(false);
			return {
				success: false,
				quest: null,
				error: /** @type {Error} */ (error),
			};
		}
	}

	/**
	 * Load quest without resetting progress
	 * @param {string} questId
	 * @returns {Promise<boolean>}
	 */
	async loadQuest(questId) {
		if (
			!this.#progressService ||
			!this.#progressService.isQuestAvailable(questId)
		) {
			return false;
		}

		this.loadQuestTask.run([questId]);
		await this.loadQuestTask.taskComplete;

		return !!this.currentQuest;
	}

	/**
	 * Resume quest from saved progress
	 */
	async resumeQuest() {
		if (!this.#progressService) return;

		const progress = this.#progressService.getProgress();
		const questId = progress.currentQuest;

		if (questId) {
			await this.startQuest(questId);

			if (progress.currentChapter) {
				this.jumpToChapter(progress.currentChapter);
			}
		}
	}

	/**
	 * Continue quest from last uncompleted chapter
	 * @param {string} questId
	 * @returns {Promise<QuestResult>}
	 */
	async continueQuest(questId) {
		this.#setLoadingState(true);
		this.#state?.resetQuestState();
		this.#worldState?.setPaused(false);
		this.#worldState?.setShowDialog(false);
		this.#worldState?.resetSlideIndex();

		try {
			const success = await this.loadQuest(questId);
			if (!success || !this.currentQuest || !this.#progressService) {
				this.#setLoadingState(false);
				return {
					success: false,
					quest: null,
					error: new Error("Quest not found"),
				};
			}

			const completedIds =
				this.#progressService.getProgress().completedChapters;
			const chapterIds = this.currentQuest.chapterIds || [];

			// Find first uncompleted chapter
			const nextIncompleteIndex = chapterIds.findIndex(
				(id) => !completedIds.includes(id),
			);

			const targetIndex = nextIncompleteIndex === -1 ? 0 : nextIncompleteIndex;
			this.currentChapterIndex = targetIndex;
			this.currentChapter = this.#getChapterByIndex(targetIndex);

			if (this.currentChapter) {
				this.#progressService.setCurrentQuest(questId, this.currentChapter.id);
				this.#sessionService?.setCurrentQuest(this.currentQuest);
				this.#sessionService?.setIsInHub(false);
				this.#updateState();
				this.#syncHeroState(this.currentChapter);

				if (this.#router) {
					this.#router.navigate(
						`/quest/${questId}/chapter/${this.currentChapter.id}`,
					);
				}
			}

			this.#setLoadingState(false);
			this.#logger?.info(`🎮 Continued quest: ${this.currentQuest.name}`);
			this.host.requestUpdate();
			return { success: true, quest: this.currentQuest };
		} catch (error) {
			this.#logger?.error("Failed to continue quest:", error);
			this.#setLoadingState(false);
			return {
				success: false,
				quest: null,
				error: /** @type {Error} */ (error),
			};
		}
	}

	/**
	 * Load specific chapter of a quest
	 * @param {string} questId
	 * @param {string} chapterId
	 * @returns {Promise<void>}
	 */
	async loadChapter(questId, chapterId) {
		this.#sessionService?.setLoading(true);
		this.#worldState?.setPaused(false);
		this.#worldState?.setShowDialog(false);
		this.#worldState?.resetSlideIndex();

		try {
			const currentQuest = this.#sessionService?.currentQuest.get();
			if (!currentQuest || currentQuest.id !== questId) {
				if (!this.#progressService?.isQuestAvailable(questId)) {
					this.#logger?.warn(`🚫 Quest ${questId} not available.`);
					await this.returnToHub(true);
					return;
				}
				await this.loadQuest(questId);
			}

			this.#sessionService?.setCurrentQuest(this.currentQuest);
			this.#sessionService?.setIsInHub(false);

			const success = this.jumpToChapter(chapterId);
			if (!success) {
				this.#logger?.info(
					`📖 Continuing quest ${questId} from last available chapter...`,
				);
				await this.continueQuest(questId);
			}

			if (this.currentChapter) {
				this.#syncHeroState(this.currentChapter);
			}
		} catch (error) {
			this.#logger?.error(`Failed to load chapter ${questId}:`, error);
		} finally {
			this.#sessionService?.setLoading(false);
		}
	}

	/**
	 * Jump to a specific chapter
	 * @param {string} chapterId
	 * @returns {boolean}
	 */
	jumpToChapter(chapterId) {
		if (!this.currentQuest || !this.#progressService) return false;

		const chapterIds = this.currentQuest.chapterIds || [];
		const index = chapterIds.indexOf(chapterId);

		if (index !== -1) {
			// Sequential check
			const allPreviousCompleted = chapterIds
				.slice(0, index)
				.every((id) => this.#progressService?.isChapterCompleted(id));

			if (index > 0 && !allPreviousCompleted) {
				this.#logger?.warn(`Cannot jump: previous chapters not completed.`);
				return false;
			}

			this.currentChapterIndex = index;
			this.currentChapter = this.#getChapterByIndex(index);
			this.#progressService.setCurrentQuest(this.currentQuest.id, chapterId);
			this.#updateState();
			this.host.requestUpdate();
			return true;
		}

		return false;
	}

	/**
	 * Sync local state with progress service
	 */
	#syncWithProgress() {
		if (!this.currentQuest || !this.#progressService) return;

		const progress = this.#progressService.getProgress();
		if (
			progress.currentQuest === this.currentQuest.id &&
			progress.currentChapter
		) {
			const chapterIds = this.currentQuest.chapterIds || [];
			const index = chapterIds.indexOf(progress.currentChapter);
			if (index !== -1) {
				this.currentChapterIndex = index;
				this.currentChapter = this.#getChapterByIndex(index);
			}
		}
	}

	/**
	 * Update quest state service
	 */
	#updateState() {
		if (!this.#state || !this.currentQuest) return;

		this.#state.setQuestTitle(this.currentQuest.name);
		this.#state.setTotalChapters(this.currentQuest.chapterIds?.length || 0);
		this.#state.setCurrentChapterNumber(this.currentChapterIndex + 1);
		this.#state.setCurrentChapterId(this.currentChapter?.id || "");
		this.#state.setLevelTitle(this.currentChapter?.title || "");
	}

	/**
	 * Get chapter config by index
	 * @param {number} index
	 * @returns {Chapter|null}
	 */
	#getChapterByIndex(index) {
		const quest = this.currentQuest;
		if (!quest?.chapterIds || !quest?.chapters) return null;
		const id = quest.chapterIds[index];
		return id ? (quest.chapters[id] ?? null) : null;
	}

	/**
	 * Complete current chapter
	 */
	completeChapter() {
		if (!this.currentQuest || !this.currentChapter || !this.#progressService)
			return;

		// 1. Hide dialog
		this.#worldState?.setShowDialog(false);

		// 2. Mark item as collected
		this.#state?.setHasCollectedItem(true);

		// 3. Mark chapter as completed in persistence
		const chapterId = this.currentChapter.id;
		this.#progressService.completeChapter(chapterId);

		const result = this.evaluateChapterTransition.execute({
			quest: this.currentQuest,
			currentIndex: this.currentChapterIndex,
		});

		if (result.isFailure) {
			this.#logger?.error("Transition evaluation failed", result.error);
			return;
		}

		const { action } =
			/** @type {import('../use-cases/evaluate-chapter-transition.js').TransitionResult} */ (
				result.value
			);

		if (action === "COMPLETE") {
			this.completeQuest();
		} else {
			// Advance ONLY if there is NO exit zone.
			// If there is an exit zone, the CollisionController will call advanceChapter when the player walks into it.
			if (!this.currentChapter.exitZone) {
				this.nextChapter();
			}
		}
	}

	/**
	 * Advance to next chapter with evolution animation
	 * @returns {Promise<void>}
	 */
	async advanceChapter() {
		if (this.#isAdvancingChapter || !this.currentQuest || !this.currentChapter)
			return;
		this.#isAdvancingChapter = true;

		try {
			this.#heroState?.setIsEvolving(true);
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (this.isLastChapter()) {
				await this.completeQuest();
			} else {
				// 1. Mark current as complete in persistence if not already
				this.#progressService?.completeChapter(this.currentChapter.id);

				// 2. Move to next
				this.nextChapter();

				if (this.currentChapter) {
					this.#syncHeroState(this.currentChapter);
				}
			}
			this.#heroState?.setIsEvolving(false);
		} finally {
			this.#isAdvancingChapter = false;
		}
	}

	/**
	 * Move to next chapter
	 */
	nextChapter() {
		if (!this.currentQuest) return;

		const nextIndex = this.currentChapterIndex + 1;
		const nextChapter = this.#getChapterByIndex(nextIndex);

		if (nextChapter) {
			this.currentChapterIndex = nextIndex;
			this.currentChapter = nextChapter;

			// Reset UI state for next chapter
			this.#worldState?.setShowDialog(false);
			this.#worldState?.setPaused(false);
			this.#worldState?.resetSlideIndex();

			this.#progressService?.setCurrentQuest(
				this.currentQuest.id,
				nextChapter.id,
			);

			if (this.#router) {
				this.#router.navigate(
					`/quest/${this.currentQuest.id}/chapter/${nextChapter.id}`,
				);
			}

			this.#updateState();
			this.#preloadNextChapters();
			this.host.requestUpdate();
		}
	}

	/**
	 * Preload upcoming chapters
	 */
	#preloadNextChapters() {
		if (!this.#preloaderService || !this.currentQuest) return;

		const nextIndex = this.currentChapterIndex + 1;
		const nextChapter = this.#getChapterByIndex(nextIndex);

		if (nextChapter) {
			this.#preloaderService.preloadChapter(nextChapter);
		}
	}

	/**
	 * Complete the entire quest
	 */
	async completeQuest() {
		if (!this.currentQuest || !this.#progressService) return;

		this.#logger?.info(`🎉 Quest completed: ${this.currentQuest.id}`);
		this.#progressService.completeQuest(this.currentQuest.id);
		this.#state?.setIsQuestCompleted(true);
		this.host.requestUpdate();
	}

	/**
	 * Return to hub
	 * @param {boolean} replace
	 * @returns {Promise<{success: boolean, error?: Error}>}
	 */
	async returnToHub(replace = false) {
		this.#state?.setIsQuestCompleted(false);
		this.#worldState?.setPaused(false);

		if (this.#sessionService?.isInHub.get() && !this.currentQuest) {
			return { success: true };
		}

		try {
			this.currentQuest = null;
			this.currentChapter = null;
			this.currentChapterIndex = 0;

			this.#state?.resetQuestState();
			this.#progressService?.setCurrentQuest(null, null);
			this.#sessionService?.setCurrentQuest(null);
			this.#sessionService?.setIsInHub(true);

			if (this.#router) {
				this.#router.navigate("/", replace);
			}

			this.host.requestUpdate();
			return { success: true };
		} catch (error) {
			this.#logger?.error("Failed to return to hub:", error);
			return { success: false, error: /** @type {Error} */ (error) };
		}
	}

	/**
	 * Syncs hero state with chapter configuration
	 * @param {Chapter} chapter
	 */
	#syncHeroState(chapter) {
		if (chapter?.startPos) {
			this.#heroState?.setPos(chapter.startPos.x, chapter.startPos.y);

			if (chapter.serviceType !== undefined) {
				const hotSwitchState = this.#mapServiceTypeToHotSwitch(
					chapter.serviceType,
				);
				this.#heroState?.setHotSwitchState(hotSwitchState);
			}
		}

		if (this.#progressService && this.#state) {
			const state = /** @type {{ hasCollectedItem: boolean } | null} */ (
				/** @type {unknown} */ (
					this.#progressService.getChapterState(chapter.id)
				)
			);
			if (state?.hasCollectedItem) {
				this.#state.setHasCollectedItem(true);
				this.#state.setIsRewardCollected(true);
			} else {
				this.#state.resetChapterState();
			}
		}
	}

	/**
	 * Maps ServiceType to HotSwitchState
	 * @param {import('../content/quests/quest-types.js').ServiceType | null} serviceType
	 */
	#mapServiceTypeToHotSwitch(serviceType) {
		if (serviceType === null) return null;

		const mapping = {
			[ServiceType.LEGACY]: HotSwitchStates.LEGACY,
			[ServiceType.NEW]: HotSwitchStates.NEW,
			[ServiceType.MOCK]: HotSwitchStates.MOCK,
		};

		return /** @type {import('../types/game.d.js').HotSwitchState} */ (
			mapping[serviceType] ?? null
		);
	}

	/**
	 * @param {boolean} isLoading
	 */
	#setLoadingState(isLoading) {
		this.#sessionService?.setLoading(isLoading);
		if (isLoading) {
			this.#state?.setIsQuestCompleted(false);
			this.#worldState?.setPaused(false);
		}
	}

	/**
	 * Handle reward collection event
	 */
	handleRewardCollected() {
		this.#state?.setIsRewardCollected(true);
		this.host.requestUpdate();
	}

	/**
	 * Get enriched data for current chapter
	 * @returns {import('../types/services.d.js').EnrichedChapter|null}
	 */
	getCurrentChapterData() {
		if (!this.currentChapter || !this.currentQuest) return null;

		return {
			...this.currentChapter,
			questId: this.currentQuest.id,
			index: this.currentChapterIndex,
			total: this.currentQuest.chapterIds?.length || 0,
			isQuestComplete: this.isLastChapter(),
		};
	}

	/**
	 * @returns {boolean}
	 */
	isLastChapter() {
		const quest = this.currentQuest;
		if (!quest?.chapterIds) return false;
		return this.currentChapterIndex === quest.chapterIds.length - 1;
	}

	/**
	 * Check if next chapter exists
	 * @returns {boolean}
	 */
	hasNextChapter() {
		const quest = this.currentQuest;
		if (!quest?.chapterIds) return false;
		return this.currentChapterIndex < quest.chapterIds.length - 1;
	}

	/**
	 * Get all available quests
	 * @returns {Quest[]}
	 */
	getAvailableQuests() {
		return this.#registry?.getAvailableQuests() || [];
	}

	/**
	 * Get coming soon quests
	 * @returns {Quest[]}
	 */
	getComingSoonQuests() {
		return this.#registry?.getComingSoonQuests() || [];
	}

	/**
	 * Get quest progress percentage
	 * @param {string} questId
	 * @returns {number}
	 */
	getQuestProgress(questId) {
		return this.#progressService?.getQuestProgress(questId) || 0;
	}

	/**
	 * Check if quest is completed
	 * @param {string} questId
	 * @returns {boolean}
	 */
	isQuestCompleted(questId) {
		return this.#progressService?.isQuestCompleted(questId) || false;
	}

	/**
	 * Reset all progress and return to hub
	 */
	resetProgress() {
		this.#progressService?.resetProgress();
		this.returnToHub();
	}

	/**
	 * Check if currently in a quest
	 * @returns {boolean}
	 */
	isInQuest() {
		return this.currentQuest !== null;
	}
}
