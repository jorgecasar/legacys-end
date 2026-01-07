import { ROUTES } from "../constants/routes.js";
import { logger } from "../services/logger-service.js";
import { CompleteQuestUseCase } from "../use-cases/complete-quest.js";
import { ContinueQuestUseCase } from "../use-cases/continue-quest.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";
import { ReturnToHubUseCase } from "../use-cases/return-to-hub.js";
import { StartQuestUseCase } from "../use-cases/start-quest.js";
import { Observable } from "../utils/observable.js";

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
 * @extends {Observable<Object>}
 */
export class GameSessionManager extends Observable {
	constructor(options = {}) {
		super();

		/**
		 * @type {{
		 *   gameState: import('../services/game-state-service').GameStateService;
		 *   progressService: import('../services/progress-service').ProgressService;
		 *   questController: import('../controllers/quest-controller').QuestController;
		 *   router: import("../utils/router.js").Router;
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
		this.router = this.options.router;

		// Controllers
		this.keyboard = this.options.controllers.keyboard;
		this.interaction = this.options.controllers.interaction;
		this.collision = this.options.controllers.collision;
		this.zones = this.options.controllers.zones;

		// Session state
		this.isLoading = false;
		this.isInHub = true;
		this.currentQuest = null;
		this._isReturningToHub = false;

		// Subscribe to game state changes
		if (this.gameState) {
			this.gameState.subscribe(() => {
				this.notify({ type: "state-change", state: this.getGameState() });
			});
		}
	}

	/**
	 * Lazy-initialize StartQuestUseCase
	 * @returns {StartQuestUseCase}
	 */
	get _startQuestUseCase() {
		if (!this.__startQuestUseCase) {
			this.__startQuestUseCase = new StartQuestUseCase({
				questController: this.questController,
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
				router: this.router,
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
			isLoading: this.isLoading,
			isInHub: this.isInHub,
			currentQuest: this.currentQuest,
			currentChapter: this.questController?.currentChapter,
			chapterId: this.questController?.currentChapter?.id,
		};
	}

	/**
	 * Start a new quest
	 */
	async startQuest(/** @type {string} */ questId) {
		this.isLoading = true;
		this.notify({ type: "loading", isLoading: true });

		const result = await this._startQuestUseCase.execute(questId);

		if (result.success) {
			this.currentQuest = result.quest;
			this.isInHub = false;
			this.notify({
				type: "navigation",
				location: "quest",
				questId,
			});
		}

		this.isLoading = false;
		this.notify({ type: "loading", isLoading: false });
	}

	/**
	 * Continue quest from last checkpoint
	 */
	async continueQuest(/** @type {string} */ questId) {
		this.isLoading = true;
		this.notify({ type: "loading", isLoading: true });

		const result = await this._continueQuestUseCase.execute(questId);

		if (result.success) {
			this.currentQuest = result.quest;
			this.isInHub = false;
			this.notify({
				type: "navigation",
				location: "quest",
				questId,
			});
		}

		this.isLoading = false;
		this.notify({ type: "loading", isLoading: false });
	}

	/**
	 * Jump to specific chapter
	 */
	jumpToChapter(/** @type {string} */ chapterId) {
		try {
			const success = this.questController.jumpToChapter(chapterId);
			if (!success) {
				this.isLoading = false;
				this.notify({ type: "loading", isLoading: false });
			}
			return success;
		} catch {
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
		this.isLoading = true;
		this.notify({ type: "loading", isLoading: true });

		try {
			// If quest not active, load it first
			if (!this.currentQuest || this.currentQuest.id !== questId) {
				if (!this.progressService.isQuestAvailable(questId)) {
					logger.warn(`🚫 Quest ${questId} not available. Redirecting to hub.`);
					this.returnToHub(true);
					return;
				}
				await this.questController.loadQuest(questId);
			}

			// Try to jump to requested chapter
			const success = this.questController.jumpToChapter(chapterId);
			if (!success) {
				logger.info(
					`📖 Continuing quest ${questId} from last available chapter...`,
				);
				await this.questController.continueQuest(questId);
			}

			this.currentQuest = this.questController.currentQuest;
			this.isInHub = false;
		} catch (error) {
			logger.error("Failed to load chapter:", error);
		} finally {
			this.isLoading = false;
			this.notify({ type: "loading", isLoading: false });
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
			// Quest completed, notify observers
			this.notify({
				type: "quest-complete",
				questId: result.questId,
			});
		}
	}

	returnToHub(replace = false) {
		if (this.isInHub && !this.currentQuest) return;

		// Guard against infinite recursion between manager and controller callbacks
		if (this._isReturningToHub) return;
		this._isReturningToHub = true;

		try {
			const result = this._returnToHubUseCase.execute(replace);

			if (result.success) {
				this.currentQuest = null;
				this.isInHub = true;
				this.notify({
					type: "navigation",
					location: "hub",
				});
			}
		} finally {
			this._isReturningToHub = false;
		}
	}

	/**
	 * Get callbacks for QuestController
	 * These will be passed to QuestController during initialization
	 */
	getQuestControllerCallbacks() {
		return {
			onQuestStart: (
				/** @type {import('../services/quest-registry-service').Quest} */ quest,
			) => {
				this.isLoading = true;
				this.currentQuest = quest;
				this.isInHub = false;
				logger.info(`🎮 Started quest: ${quest.name}`);
				this.notify({ type: "loading", isLoading: true });
				this.isLoading = false;
				this.notify({ type: "loading", isLoading: false });
			},
			onChapterChange: (
				/** @type {any} */ chapter,
				/** @type {number} */ index,
			) => {
				// Update URL to reflect chapter (without reloading)
				if (this.currentQuest && this.router) {
					this.router.navigate(
						ROUTES.CHAPTER(this.currentQuest.id, chapter.id),
						false, // Push to history instead of replace
					);
				}

				// Ensure we have fresh data and setup the world
				const chapterData = chapter; // Full data passed from QuestController.getCurrentChapterData()
				if (chapterData?.startPos) {
					this.gameState.setHeroPosition(
						chapterData.startPos.x,
						chapterData.startPos.y,
					);

					// Don't automatically set hotSwitchState based on serviceType
					// Let it remain null unless explicitly set by zones or user interaction

					// If chapter has hot switch, check zones (might override to null if outside zones)
					if (chapterData.hasHotSwitch && this.zones) {
						this.zones.checkZones(
							chapterData.startPos.x,
							chapterData.startPos.y,
						);
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
					logger.info(
						`🔄 Restored collected item state for chapter ${chapter.id}`,
					);
				}

				logger.info(
					`📖 Chapter ${index + 1}/${chapter.total}: ${chapterData?.name || chapter.id}`,
				);

				this.notify({
					type: "chapter-change",
					chapter,
					index,
				});
			},
			onQuestComplete: (
				/** @type {import('../services/quest-registry-service').Quest} */ quest,
			) => {
				logger.info(`✅ Completed quest: ${quest.name}`);
				logger.info(`🏆 Earned badge: ${quest.reward?.badge}`);
				this.notify({
					type: "quest-complete",
					quest,
				});
			},
			onReturnToHub: () => {
				this.returnToHub();
			},
		};
	}
}
