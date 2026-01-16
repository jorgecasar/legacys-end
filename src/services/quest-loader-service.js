import { GameEvents } from "../core/event-bus.js";
import { CompleteQuestUseCase } from "../use-cases/complete-quest.js";
import { ContinueQuestUseCase } from "../use-cases/continue-quest.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";
import { ReturnToHubUseCase } from "../use-cases/return-to-hub.js";
import { StartQuestUseCase } from "../use-cases/start-quest.js";
import { ServiceType } from "./user-services.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * QuestLoaderService - Orchestrates quest lifecycle and state synchronization.
 *
 * Replaces the orchestration logic previously in GameSessionManager.
 */
export class QuestLoaderService {
	/**
	 * @param {IGameContext} context
	 */
	constructor(context) {
		this.context = context;
		this._isReturningToHub = false;

		// Use Cases
		this._startQuestUseCase = new StartQuestUseCase({
			questController: context.questController,
			eventBus: context.eventBus,
			logger: context.logger,
		});

		this._continueQuestUseCase = new ContinueQuestUseCase({
			questController: context.questController,
			eventBus: context.eventBus,
			logger: context.logger,
		});

		this._returnToHubUseCase = new ReturnToHubUseCase({
			questController: context.questController,
			logger: context.logger,
		});

		this._completeQuestUseCase = new CompleteQuestUseCase({
			questController: context.questController,
			eventBus: context.eventBus,
			logger: context.logger,
		});

		this._interactWithNpcUseCase = new InteractWithNpcUseCase();
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		if (!this.context.eventBus) return;

		this.context.eventBus.on(GameEvents.CHAPTER_CHANGED, (payload) =>
			this.#handleChapterChange(payload),
		);
	}

	/**
	 * Start a new quest
	 * @param {string} questId
	 */
	async startQuest(questId) {
		this.#setLoadingState(true);
		this.context.questState.resetQuestState();
		this.context.gameState.resetQuestState();

		const result = await this._startQuestUseCase.execute(questId);

		if (result.success) {
			this.context.sessionService.setCurrentQuest(result.quest);
			this.context.sessionService.setIsInHub(false);
			this.context.logger.info(`🎮 Started quest: ${result.quest.name}`);
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
		this.context.questState.resetQuestState();
		this.context.gameState.resetQuestState();

		const result = await this._continueQuestUseCase.execute(questId);

		if (result.success) {
			this.context.sessionService.setCurrentQuest(result.quest);
			this.context.sessionService.setIsInHub(false);
			this.context.logger.info(`🎮 Continues quest: ${result.quest.name}`);
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
		this.context.sessionService.setLoading(true);

		try {
			// If quest not active, load it first
			const currentQuest = this.context.sessionService.currentQuest.get();
			if (!currentQuest || currentQuest.id !== questId) {
				if (!this.context.progressService.isQuestAvailable(questId)) {
					this.context.logger.warn(
						`🚫 Quest ${questId} not available. Redirecting to hub.`,
					);
					this.returnToHub(true);
					return;
				}
				await this.context.questController.loadQuest(questId);
			}

			// Try to jump to requested chapter
			const success = this.context.questController.jumpToChapter(chapterId);
			if (!success) {
				this.context.logger.info(
					`📖 Continuing quest ${questId} from last available chapter...`,
				);
				await this.context.questController.continueQuest(questId);
			}

			this.context.sessionService.setCurrentQuest(
				this.context.questController.currentQuest,
			);
			this.context.sessionService.setIsInHub(false);
		} catch (error) {
			this.context.logger.error("Failed to load chapter:", error);
		} finally {
			this.context.sessionService.setLoading(false);
		}
	}

	/**
	 * Complete current chapter
	 */
	completeChapter() {
		this.context.questController?.completeChapter();
	}

	/**
	 * Complete entire quest
	 */
	completeQuest() {
		const result = this._completeQuestUseCase.execute();

		if (result.success) {
			this.context.questState.setIsQuestCompleted(true);
			this.context.gameState.setQuestCompleted(true);
		}
	}

	/**
	 * Return to quest hub
	 * @param {boolean} replace
	 */
	async returnToHub(replace = false) {
		this.context.questState.setIsQuestCompleted(false);
		this.context.gameState.setQuestCompleted(false);
		this.context.worldState.setPaused(false);
		this.context.gameState.setPaused(false);

		if (
			this.context.sessionService.isInHub.get() &&
			!this.context.sessionService.currentQuest.get()
		) {
			return { success: true };
		}

		if (this._isReturningToHub) return { success: true };
		this._isReturningToHub = true;

		try {
			const result = await this._returnToHubUseCase.execute(replace);

			if (result.success) {
				this.context.sessionService.setCurrentQuest(null);
				this.context.sessionService.setIsInHub(true);
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
			this.context.heroState.setPos(chapter.startPos.x, chapter.startPos.y);

			if (chapter.serviceType !== undefined) {
				const hotSwitchState = this.#mapServiceTypeToHotSwitch(
					chapter.serviceType,
				);
				this.context.heroState.setHotSwitchState(hotSwitchState);
			}
		}

		this.context.questState.resetChapterState();
		this.context.gameState.resetChapterState();

		// Restore state if available
		const state = /** @type {any} */ (
			this.context.progressService.getChapterState(chapter.id)
		);
		if (state?.hasCollectedItem) {
			this.context.questState.setHasCollectedItem(true);
			this.context.questState.setIsRewardCollected(true);
		}

		this.context.logger.info(
			`📖 Chapter ${index + 1}/${chapter.total}: ${chapter.name || chapter.id}`,
		);
	}

	/**
	 * Maps ServiceType to HotSwitchState
	 * @param {import('./user-services.js').ServiceType | null} serviceType
	 */
	#mapServiceTypeToHotSwitch(serviceType) {
		if (serviceType === null) return null;

		const mapping = {
			[ServiceType.LEGACY]: "legacy",
			[ServiceType.NEW]: "new",
			[ServiceType.MOCK]: "mock",
		};

		return (
			/** @type {import('../services/game-state-service').HotSwitchState} */ (
				mapping[serviceType]
			) || null
		);
	}

	/**
	 * @param {boolean} isLoading
	 */
	#setLoadingState(isLoading) {
		this.context.sessionService.setLoading(isLoading);
		if (isLoading) {
			this.context.questState.setIsQuestCompleted(false);
			this.context.gameState.setQuestCompleted(false);
			this.context.worldState.setPaused(false);
			this.context.gameState.setPaused(false);
		}
	}
}
