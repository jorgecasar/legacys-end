import { Signal } from "@lit-labs/signals";
import { GameEvents } from "../core/event-bus.js";
import { ServiceType } from "../services/user-services.js";
import { CompleteQuestUseCase } from "../use-cases/complete-quest.js";
import { ContinueQuestUseCase } from "../use-cases/continue-quest.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";
import { ReturnToHubUseCase } from "../use-cases/return-to-hub.js";
import { StartQuestUseCase } from "../use-cases/start-quest.js";

/**
 * GameSessionManager
 *
 * Orchestrates game session logic, coordinating between:
 * - Quest lifecycle (start, continue, complete)
 * - Game state synchronization
 * - Controller coordination
 * - Navigation/routing
 *
 * Emits events for view updates:
 * - 'state-change': Game state has changed
 * - 'navigation': Navigation event (quest start, hub return)
 * - 'loading': Loading state changed
 * Emits events via Signals for view updates.
 */
export class GameSessionManager {
	constructor(options = {}) {
		/**
		 * @type {{
		 *   gameState: import('../services/game-state-service').GameStateService;
		 *   progressService: import('../services/progress-service').ProgressService;
		 *   questController: import('../controllers/quest-controller').QuestController;
		 *   router: import("../utils/router.js").Router;
		 *   eventBus: import('../core/event-bus.js').EventBus;
		 *   logger: import('../services/logger-service.js').LoggerService;
		 *   controllers: {
		 *     keyboard: import("../controllers/keyboard-controller.js").KeyboardController;
		 *     interaction: import("../controllers/interaction-controller.js").InteractionController;
		 *     collision: import("../controllers/collision-controller.js").CollisionController;
		 *     zones: import("../controllers/game-zone-controller.js").GameZoneController;
		 *   };
		 * }}
		 */
		this.options = {
			gameState: /** @type {any} */ (null),
			progressService: /** @type {any} */ (null),
			questController: /** @type {any} */ (null),
			router: /** @type {any} */ (null),
			eventBus: /** @type {any} */ (null),
			logger: /** @type {any} */ (null),
			controllers: {
				keyboard: /** @type {any} */ (null),
				interaction: /** @type {any} */ (null),
				collision: /** @type {any} */ (null),
				zones: /** @type {any} */ (null),
			},
			...options,
		};

		// Services
		/** @type {import('../services/game-state-service').GameStateService} */
		this.gameState = this.options.gameState;
		this.progressService = this.options.progressService;
		this.questController = this.options.questController;
		// Router removed
		this.eventBus = this.options.eventBus;
		/** @type {import('../services/logger-service.js').LoggerService} */
		this.logger = this.options.logger;

		// Controllers
		this.keyboard = this.options.controllers.keyboard;
		this.interaction = this.options.controllers.interaction;
		this.collision = this.options.controllers.collision;
		this.zones = this.options.controllers.zones;

		// Session state (Signals)
		this.isLoading = new Signal.State(false);
		this.isInHub = new Signal.State(true);
		this.currentQuest = new Signal.State(
			/** @type {import('../services/quest-registry-service').Quest|null} */ (
				null
			),
		);

		this._isReturningToHub = false;
	}

	/**
	 * Setup event listeners for global events
	 */
	setupEventListeners() {
		if (!this.eventBus) return;

		this.eventBus.on(GameEvents.CHAPTER_CHANGED, (payload) =>
			this.#handleChapterChange(payload),
		);
	}

	/**
	 * Handle chapter change event
	 * @param {Object} payload
	 * @param {any} payload.chapter
	 * @param {number} payload.index
	 */
	#handleChapterChange({ chapter, index }) {
		// Ensure we have fresh data and setup the world
		const chapterData = chapter;

		if (chapterData?.startPos) {
			this.gameState.setHeroPosition(
				chapterData.startPos.x,
				chapterData.startPos.y,
			);

			// Mapping ServiceType to HotSwitchState
			if (chapterData.serviceType !== undefined) {
				const hotSwitchState = this.#mapServiceTypeToHotSwitch(
					chapterData.serviceType,
				);
				this.gameState.setHotSwitchState(hotSwitchState);
			}
		}
		this.gameState.resetChapterState();

		// Restore state if available
		const state = /** @type {any} */ (
			this.progressService.getChapterState(chapter.id)
		);
		if (state.hasCollectedItem) {
			this.gameState.setCollectedItem(true);
			this.gameState.setRewardCollected(true);
			this.logger.info(
				`🔄 Restored collected item state for chapter ${chapter.id}`,
			);
		}

		this.logger.info(
			`📖 Chapter ${index + 1}/${chapter.total}: ${chapterData?.name || chapter.id}`,
		);

		// Reactivity: App observes QuestController.currentChapter or events
	}

	/**
	 * Lazy-initialize StartQuestUseCase
	 * @returns {StartQuestUseCase}
	 */
	get _startQuestUseCase() {
		if (!this.__startQuestUseCase) {
			this.__startQuestUseCase = new StartQuestUseCase({
				questController: this.questController,
				eventBus: this.eventBus,
				logger: this.logger,
			});
		}
		return this.__startQuestUseCase;
	}

	/**
	 * Lazy-initialize ContinueQuestUseCase
	 * @returns {ContinueQuestUseCase}
	 */
	get _continueQuestUseCase() {
		if (!this.__continueQuestUseCase) {
			this.__continueQuestUseCase = new ContinueQuestUseCase({
				questController: this.questController,
				eventBus: this.eventBus,
				logger: this.logger,
			});
		}
		return this.__continueQuestUseCase;
	}

	/**
	 * Lazy-initialize ReturnToHubUseCase
	 * @returns {ReturnToHubUseCase}
	 */
	get _returnToHubUseCase() {
		if (!this.__returnToHubUseCase) {
			this.__returnToHubUseCase = new ReturnToHubUseCase({
				questController: this.questController,
				// Router removed
				logger: this.logger,
			});
		}
		return this.__returnToHubUseCase;
	}

	/**
	 * Lazy-initialize InteractWithNpcUseCase
	 * @returns {InteractWithNpcUseCase}
	 */
	get _interactWithNpcUseCase() {
		if (!this.__interactWithNpcUseCase) {
			this.__interactWithNpcUseCase = new InteractWithNpcUseCase();
		}
		return this.__interactWithNpcUseCase;
	}

	/**
	 * Lazy-initialize CompleteQuestUseCase
	 * @returns {CompleteQuestUseCase}
	 */
	get _completeQuestUseCase() {
		if (!this.__completeQuestUseCase) {
			this.__completeQuestUseCase = new CompleteQuestUseCase({
				questController: this.questController,
				eventBus: this.eventBus,
				logger: this.logger,
			});
		}
		return this.__completeQuestUseCase;
	}

	/**
	 * Get current game state for rendering
	 */
	getGameState() {
		const state = this.gameState?.getState() || {};
		return {
			...state,
			isLoading: this.isLoading.get(),
			isInHub: this.isInHub.get(),
			currentQuest: this.currentQuest.get(),
			currentChapter: this.questController?.currentChapter,
			chapterId: this.questController?.currentChapter?.id,
		};
	}

	/**
	 * Start a new quest
	 */
	async startQuest(/** @type {string} */ questId) {
		this.#setLoadingState(true);
		this.gameState.resetQuestState();

		const result = await this._startQuestUseCase.execute(questId);

		if (result.success) {
			this.currentQuest.set(result.quest);
			this.isInHub.set(false);
			this.logger.info(`🎮 Started quest: ${result.quest.name}`);
		}

		this.#setLoadingState(false);
		return result;
	}

	/**
	 * Continue quest from last checkpoint
	 */
	async continueQuest(/** @type {string} */ questId) {
		this.#setLoadingState(true);
		this.gameState.resetQuestState();

		const result = await this._continueQuestUseCase.execute(questId);

		if (result.success) {
			this.currentQuest.set(result.quest);
			this.isInHub.set(false);
			this.logger.info(`🎮 Continues quest: ${result.quest.name}`);
		}

		this.#setLoadingState(false);
		return result;
	}

	/**
	 * Jump to specific chapter
	 */
	jumpToChapter(/** @type {string} */ chapterId) {
		try {
			const success = this.questController.jumpToChapter(chapterId);
			if (!success) {
				this.notifyLoading(false);
			}
			return success;
		} catch {
			this.notifyLoading(false);
			return false;
		}
	}

	/**
	 * Load a specific chapter of a quest (handles quest loading if needed)
	 */
	async loadChapter(
		/** @type {string} */ questId,
		/** @type {string} */ chapterId,
	) {
		this.isLoading.set(true);
		this.notifyLoading(true);

		try {
			// If quest not active, load it first
			const currentQuest = this.currentQuest.get();
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

			this.currentQuest.set(this.questController.currentQuest);
			this.isInHub.set(false);
		} catch (error) {
			this.logger.error("Failed to load chapter:", error);
		} finally {
			this.isLoading.set(false);
			this.notifyLoading(false);
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
			this.gameState.setQuestCompleted(true);
		}
	}

	async returnToHub(replace = false) {
		// Ensure clean state even if called directly
		// (Do this before guard, as we might want to clear UI state even if already in hub logic)
		this.gameState.setQuestCompleted(false);
		this.gameState.setPaused(false);

		if (this.isInHub.get() && !this.currentQuest.get()) {
			return { success: true };
		}

		// Guard against infinite recursion
		if (this._isReturningToHub) return { success: true };
		this._isReturningToHub = true;

		try {
			const result = /** @type {{success: boolean, error?: Error}} */ (
				await this._returnToHubUseCase.execute(replace)
			);

			if (result.success) {
				this.currentQuest.set(null);
				this.isInHub.set(true);
				// Navigation implicit
			}
			return result;
		} finally {
			this._isReturningToHub = false;
		}
	}

	/**
	 * Maps ServiceType to HotSwitchState
	 * @param {import('../services/user-services').ServiceType | null} serviceType
	 * @returns {import('../services/game-state-service').HotSwitchState}
	 */
	#mapServiceTypeToHotSwitch(serviceType) {
		if (serviceType === null) {
			return null;
		}

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
	 * Sets loading state and prepares game for quest
	 * @param {boolean} isLoading
	 */
	#setLoadingState(isLoading) {
		this.isLoading.set(isLoading);
		if (isLoading) {
			this.gameState.setQuestCompleted(false);
			this.gameState.setPaused(false);
		}
		this.notifyLoading(isLoading);
	}

	/**
	 * @param {boolean} _isLoading
	 */
	notifyLoading(_isLoading) {
		// Temporary shim if something still listens to notify? No, we removed Observable.
		// Leaving this empty or using it for logger
	}
}
