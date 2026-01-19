import { GameEvents } from "../core/event-bus.js";
import { CompleteQuestUseCase } from "../use-cases/complete-quest.js";
import { ContinueQuestUseCase } from "../use-cases/continue-quest.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";
import { ReturnToHubUseCase } from "../use-cases/return-to-hub.js";
import { StartQuestUseCase } from "../use-cases/start-quest.js";
import { ServiceType } from "./user-api-client.js";

/**
 * QuestLoaderService - Orchestrates quest lifecycle and state synchronization.
 *
 * Replaces the orchestration logic previously in GameSessionManager.
 */
export class QuestLoaderService {
	/**
	 * @param {Object} dependencies
	 * @param {import('../controllers/quest-controller.js').QuestController} dependencies.questController
	 * @param {import('../core/event-bus.js').EventBus} dependencies.eventBus
	 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
	 * @param {import('../game/services/quest-state-service.js').QuestStateService} dependencies.questState
	 * @param {import('../services/session-service.js').SessionService} dependencies.sessionService
	 * @param {import('../services/progress-service.js').ProgressService} dependencies.progressService
	 * @param {import('../game/services/world-state-service.js').WorldStateService} dependencies.worldState
	 * @param {import('../game/services/hero-state-service.js').HeroStateService} dependencies.heroState
	 * @param {import('../utils/router.js').Router} [dependencies.router]
	 */
	constructor({
		questController,
		eventBus,
		logger,
		questState,
		sessionService,
		progressService,
		worldState,
		heroState,
		router,
	}) {
		this.questController = questController;
		this.eventBus = eventBus;
		this.logger = logger;
		this.questState = questState;
		this.sessionService = sessionService;
		this.progressService = progressService;
		this.worldState = worldState;
		this.heroState = heroState;
		/** @type {import('../utils/router.js').Router | undefined} */
		this.router = router;

		this._isReturningToHub = false;

		// Use Cases
		this._startQuestUseCase = new StartQuestUseCase({
			questController,
			eventBus,
			logger,
		});

		this._continueQuestUseCase = new ContinueQuestUseCase({
			questController,
			eventBus,
			logger,
		});

		this._returnToHubUseCase = new ReturnToHubUseCase({
			questController,
			logger,
		});

		this._completeQuestUseCase = new CompleteQuestUseCase({
			questController,
			eventBus,
			logger,
		});

		this._interactWithNpcUseCase = new InteractWithNpcUseCase();
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		if (!this.eventBus) return;

		this.eventBus.on(GameEvents.CHAPTER_CHANGED, (payload) =>
			this.#handleChapterChange(payload),
		);
	}

	/**
	 * Start a new quest
	 * @param {string} questId
	 */
	async startQuest(questId) {
		this.#setLoadingState(true);
		this.questState.resetQuestState();

		const result = await this._startQuestUseCase.execute(questId);

		if (result.success) {
			this.sessionService.setCurrentQuest(result.quest);
			this.sessionService.setIsInHub(false);
			this.questState.setQuestTitle(result.quest.name);
			this.logger.info(`🎮 Started quest: ${result.quest.name}`);

			if (this.router) {
				const chapterId = result.quest.chapterIds[0];
				this.router.navigate(`/quest/${questId}/chapter/${chapterId}`);
			}
		}

		this.#setLoadingState(false);
		return result;
	}

	/**
	 * Continue quest from last checkpoint
	 * @param {string} questId
	 */
	async continueQuest(questId) {
		this.#setLoadingState(true);
		this.questState.resetQuestState();

		const result = await this._continueQuestUseCase.execute(questId);

		if (result.success) {
			this.sessionService.setCurrentQuest(result.quest);
			this.sessionService.setIsInHub(false);
			this.questState.setQuestTitle(result.quest.name);
			this.logger.info(`🎮 Continues quest: ${result.quest.name}`);

			if (this.router) {
				const currentChapterId = this.questState.currentChapterId.get();
				if (currentChapterId) {
					this.router.navigate(`/quest/${questId}/chapter/${currentChapterId}`);
				}
			}
		}

		this.#setLoadingState(false);
		return result;
	}

	/**
	 * Load a specific chapter of a quest
	 * @param {string} questId
	 * @param {string} chapterId
	 */
	async loadChapter(questId, chapterId) {
		this.sessionService.setLoading(true);

		try {
			// If quest not active, load it first
			const currentQuest = this.sessionService.currentQuest.get();
			if (!currentQuest || currentQuest.id !== questId) {
				if (!this.progressService.isQuestAvailable(questId)) {
					this.logger.warn(
						`🚫 Quest ${questId} not available. Redirecting to hub.`,
					);
					this.returnToHub(true);
					return;
				}
				await this.questController.loadQuest(questId);
			}

			// Try to jump to requested chapter
			const success = this.questController.jumpToChapter(chapterId);
			if (!success) {
				this.logger.info(
					`📖 Continuing quest ${questId} from last available chapter...`,
				);
				await this.questController.continueQuest(questId);
			}

			this.sessionService.setCurrentQuest(this.questController.currentQuest);
			this.sessionService.setIsInHub(false);
		} catch (error) {
			this.logger.error("Failed to load chapter:", error);
		} finally {
			this.sessionService.setLoading(false);
		}
	}

	/**
	 * Advance to next chapter with evolution animation
	 */
	async advanceChapter() {
		if (this._isAdvancingChapter) return;
		this._isAdvancingChapter = true;

		try {
			const quest = this.sessionService.currentQuest.get();
			if (quest) {
				this.heroState.setIsEvolving(true);

				// Simulate evolution animation duration
				await new Promise((resolve) => setTimeout(resolve, 500));

				if (this.questController.isLastChapter()) {
					await this.completeQuest();
				} else {
					this.completeChapter();
				}
				this.heroState.setIsEvolving(false);
			}
		} finally {
			this._isAdvancingChapter = false;
		}
	}

	/**
	 * Complete current chapter
	 */
	completeChapter() {
		this.questController?.completeChapter();
	}

	/**
	 * Complete entire quest
	 */
	completeQuest() {
		const result = this._completeQuestUseCase.execute();

		if (result.success) {
			this.questState.setIsQuestCompleted(true);
		}
	}

	/**
	 * Return to quest hub
	 * @param {boolean} replace
	 */
	async returnToHub(replace = false) {
		this.questState.setIsQuestCompleted(false);
		this.worldState.setPaused(false);

		if (
			this.sessionService.isInHub.get() &&
			!this.sessionService.currentQuest.get()
		) {
			return { success: true };
		}

		if (this._isReturningToHub) return { success: true };
		this._isReturningToHub = true;

		try {
			const result = await this._returnToHubUseCase.execute(replace);

			if (result.success) {
				this.sessionService.setCurrentQuest(null);
				this.sessionService.setIsInHub(true);

				if (this.router) {
					this.router.navigate("/");
				}
			}
			return result;
		} finally {
			this._isReturningToHub = false;
		}
	}

	/**
	 * Handle chapter change event
	 * @param {any} payload
	 */
	#handleChapterChange(payload) {
		const { chapter, index } = payload;
		if (chapter?.startPos) {
			this.heroState.setPos(chapter.startPos.x, chapter.startPos.y);

			if (chapter.serviceType !== undefined) {
				const hotSwitchState = this.#mapServiceTypeToHotSwitch(
					chapter.serviceType,
				);
				this.heroState.setHotSwitchState(hotSwitchState);
			}
		}

		this.questState.setCurrentChapterId(chapter.id);
		this.questState.resetChapterState();

		// Restore state if available
		const state = /** @type {any} */ (
			this.progressService.getChapterState(chapter.id)
		);
		if (state?.hasCollectedItem) {
			this.questState.setHasCollectedItem(true);
			this.questState.setIsRewardCollected(true);
		}

		this.questState.setLevelTitle(chapter.title || chapter.id);
		this.questState.setCurrentChapterNumber(index + 1);
		this.questState.setTotalChapters(payload.total);

		this.logger.info(
			`📖 Chapter ${index + 1}/${payload.total}: ${chapter.title}`,
		);

		// Update URL
		if (this.router) {
			const questId = this.sessionService.currentQuest.get()?.id;
			if (questId) {
				this.router.navigate(`/quest/${questId}/chapter/${chapter.id}`);
			}
		}
	}

	/**
	 * Maps ServiceType to HotSwitchState
	 * @param {import('./user-api-client.js').ServiceType | null} serviceType
	 */
	#mapServiceTypeToHotSwitch(serviceType) {
		if (serviceType === null) return null;

		const mapping = {
			[ServiceType.LEGACY]: "legacy",
			[ServiceType.NEW]: "new",
			[ServiceType.MOCK]: "mock",
		};

		return (
			/** @type {import('../game/interfaces.js').HotSwitchState} */ (
				mapping[serviceType]
			) || null
		);
	}

	/**
	 * @param {boolean} isLoading
	 */
	#setLoadingState(isLoading) {
		this.sessionService.setLoading(isLoading);
		if (isLoading) {
			this.questState.setIsQuestCompleted(false);
			this.worldState.setPaused(false);
		}
	}
}
