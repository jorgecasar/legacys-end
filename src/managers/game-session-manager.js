import { logger } from "../services/logger-service.js";
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
 */
export class GameSessionManager extends Observable {
	constructor(options = {}) {
		super();

		this.options = {
			gameState: null,
			progressService: null,
			questController: null,
			router: null,
			controllers: {},
			...options,
		};

		// Services
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

		// Subscribe to game state changes
		if (this.gameState) {
			this.gameState.subscribe(() => {
				this.notify({ type: "state-change", state: this.getGameState() });
			});
		}
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
	async startQuest(questId) {
		this.isLoading = true;
		this.notify({ type: "loading", isLoading: true });

		try {
			await this.questController.startQuest(questId);
			this.currentQuest = this.questController.currentQuest;
			this.isInHub = false;

			this.notify({
				type: "navigation",
				location: "quest",
				questId,
			});
		} catch (error) {
			logger.error("Failed to start quest:", error);
		} finally {
			this.isLoading = false;
			this.notify({ type: "loading", isLoading: false });
		}
	}

	/**
	 * Continue quest from last checkpoint
	 */
	async continueQuest(questId) {
		this.isLoading = true;
		this.notify({ type: "loading", isLoading: true });

		try {
			await this.questController.continueQuest(questId);
			this.currentQuest = this.questController.currentQuest;
			this.isInHub = false;

			this.notify({
				type: "navigation",
				location: "quest",
				questId,
			});
		} catch (error) {
			logger.error("Failed to continue quest:", error);
		} finally {
			this.isLoading = false;
			this.notify({ type: "loading", isLoading: false });
		}
	}

	/**
	 * Jump to specific chapter
	 */
	jumpToChapter(chapterId) {
		const success = this.questController.jumpToChapter(chapterId);
		if (!success) {
			this.isLoading = false;
			this.notify({ type: "loading", isLoading: false });
		}
		return success;
	}

	/**
	 * Complete current chapter
	 */
	completeChapter() {
		this.questController.completeChapter();
	}

	/**
	 * Complete entire quest
	 */
	completeQuest() {
		this.questController.completeQuest();
	}

	/**
	 * Return to hub
	 */
	returnToHub() {
		this.questController.returnToHub();
		this.currentQuest = null;
		this.isInHub = true;

		this.notify({
			type: "navigation",
			location: "hub",
		});
	}

	/**
	 * Handle keyboard movement
	 */
	handleMove(dx, dy) {
		const currentConfig = this.questController?.currentChapter;
		if (!currentConfig) return;

		const state = this.gameState.getState();
		let { x, y } = state.heroPos;
		x += dx;
		y += dy;

		// Clamp
		x = Math.max(2, Math.min(98, x));
		y = Math.max(2, Math.min(98, y));

		// Check Exit Collision
		if (this.questController?.hasExitZone()) {
			this.collision.checkExitZone(
				x,
				y,
				currentConfig.exitZone,
				state.hasCollectedItem,
			);
		}

		this.gameState.setHeroPosition(x, y);
		this.zones.checkZones(x, y);
	}

	/**
	 * Handle keyboard interaction
	 */
	handleInteract() {
		this.interaction.handleInteract();
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		if (this.isInHub) return;
		const state = this.gameState.getState();
		this.gameState.setPaused(!state.isPaused);
	}

	/**
	 * Trigger level transition (evolution animation + chapter completion)
	 */
	triggerLevelTransition() {
		if (this.questController?.isInQuest()) {
			this.gameState.setEvolving(true);
			setTimeout(() => {
				this.questController.completeChapter();
				this.gameState.setEvolving(false);
			}, 500);
		}
	}

	/**
	 * Handle pause menu actions
	 */
	handleResume() {
		this.gameState.setPaused(false);
	}

	handleRestartQuest() {
		if (this.questController.currentQuest) {
			this.startQuest(this.questController.currentQuest.id);
			this.gameState.setPaused(false);
		}
	}

	handleQuitToHub() {
		this.returnToHub();
		this.gameState.setPaused(false);
	}

	/**
	 * Get callbacks for QuestController
	 * These will be passed to QuestController during initialization
	 */
	getQuestControllerCallbacks() {
		return {
			onQuestStart: (quest) => {
				this.isLoading = true;
				this.currentQuest = quest;
				this.isInHub = false;
				logger.info(`🎮 Started quest: ${quest.name}`);
				this.notify({ type: "loading", isLoading: true });
				this.isLoading = false;
				this.notify({ type: "loading", isLoading: false });
			},
			onChapterChange: (chapter, index) => {
				this.notify({
					type: "chapter-change",
					chapter,
					index,
				});
			},
			onQuestComplete: (quest) => {
				logger.info(`✅ Completed quest: ${quest.name}`);
				logger.info(`🏆 Earned badge: ${quest.reward.badge}`);
				this.notify({
					type: "quest-complete",
					quest,
				});
			},
			onReturnToHub: () => {
				this.currentQuest = null;
				this.isInHub = true;
				logger.info(`🏛️ Returned to Hub`);
				this.notify({
					type: "navigation",
					location: "hub",
				});
			},
		};
	}
}
