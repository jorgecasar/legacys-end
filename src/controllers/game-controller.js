/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("../core/game-context.js").IGameContext} IGameContext
 */

import { AdvanceChapterCommand } from "../commands/advance-chapter-command.js";

/**
 * @typedef {Object} GameControllerOptions
 * @property {boolean} [exposeToConsole=true] - Whether to expose game service to console as window.game
 * @property {import('../services/logger-service.js').LoggerService} [logger]
 * @property {import('../game/interfaces.js').IHeroStateService} [heroState]
 * @property {import('../game/interfaces.js').IQuestStateService} [questState]
 * @property {import('../game/interfaces.js').IWorldStateService} [worldState]
 * @property {import('../controllers/quest-controller.js').QuestController} [questController]
 * @property {import('../commands/command-bus.js').CommandBus} [commandBus]
 * @property {import('../services/quest-loader-service.js').QuestLoaderService} [questLoader]
 */

/**
 * GameController - Lit Reactive Controller for game logic
 *
 * Handles:
 * - Debug mode
 * - Level completion logic (listening to events)
 *
 * @implements {ReactiveController}
 */
export class GameController {
	/**
	 * @param {ReactiveControllerHost} host
	 * @param {GameControllerOptions & Partial<IGameContext>} options
	 */
	constructor(host, options) {
		this.host = host;
		this.options = options;
		this.logger = options.logger;
		this.isEnabled = new URLSearchParams(window.location.search).has("debug");
		/** @type {boolean} */
		this.isTransitioning = false;

		host.addController(this);
	}

	hostConnected() {
		if (this.isEnabled) {
			this.enableDebugMode();
		}
	}

	handleExitZoneReached = () => {
		// Prevent multiple triggers
		if (this.isTransitioning) return;

		const {
			heroState,
			worldState,
			questState,
			questController,
			commandBus,
			questLoader,
		} = this.options;
		if (
			commandBus &&
			heroState &&
			worldState &&
			questState &&
			questController &&
			questLoader
		) {
			this.isTransitioning = true;
			commandBus
				.execute(
					new AdvanceChapterCommand({
						heroState,
						questLoader,
					}),
				)
				.finally(() => {
					// Reset flag after a delay or let the next chapter load reset it naturally
					// For now, we keep it true until the next chapter or reset happens externally
					setTimeout(() => {
						this.isTransitioning = false;
					}, 2000);
				});
		}
	};

	/**
	 * Handle level completion event
	 * Executes logic to advance chapter or complete quest
	 */
	handleLevelCompleted = () => {
		const {
			heroState,
			worldState,
			questState,
			questController,
			commandBus,
			questLoader,
		} = this.options;

		// 1. Hide dialog if open (handled by UI state, but ensures clean slate)
		worldState?.setShowDialog(false);

		// 2. Check if we should advance to next chapter
		const isRewardCollected = questState?.isRewardCollected.get();
		const hasNext = questController?.hasNextChapter();

		if (isRewardCollected && hasNext) {
			this.logger?.info("📖 Advancing to next chapter");
			// Stop auto-move if any? (Handled by AdvanceChapterCommand presumably or logic)

			if (commandBus && heroState && worldState && questState && questLoader) {
				commandBus.execute(
					new AdvanceChapterCommand({
						heroState,
						questLoader,
					}),
				);
			}
		} else {
			// Just mark item as collected/level complete state
			this.logger?.info("✅ Level Goal Reached (Item Collected)");
			questState?.setHasCollectedItem(true);
		}
	};

	enableDebugMode() {
		this.logger?.info(`
		🎮 DEBUG MODE ENABLED
		━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		Type 'app.questLoader.help()' for available commands
		━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				`);

		// Show initial state (legacy)
		// this.options.gameService.getState();
	}
}
