/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("../services/game-service.js").GameService} GameService
 * @typedef {import("../core/game-context.js").IGameContext} IGameContext
 */

import { AdvanceChapterCommand } from "../commands/advance-chapter-command.js";
import { EVENTS } from "../constants/events.js";

/**
 * @typedef {Object} GameControllerOptions
 * @property {GameService} gameService - Game service instance to use for game commands
 * @property {boolean} [exposeToConsole=true] - Whether to expose game service to console as window.game
 * @property {import('../services/logger-service.js').LoggerService} [logger]
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

		if (!options.gameService) {
			throw new Error("GameController requires a gameService option");
		}

		host.addController(this);
	}

	hostConnected() {
		if (this.isEnabled) {
			this.enableDebugMode();
		}

		// Listen for level completion
		this.options.eventBus?.on(
			EVENTS.UI.LEVEL_COMPLETED,
			this.handleLevelCompleted,
		);
		// Listen for exit zone
		this.options.eventBus?.on(
			EVENTS.UI.EXIT_ZONE_REACHED,
			this.handleExitZoneReached,
		);
	}

	hostDisconnected() {
		this.options.eventBus?.off(
			EVENTS.UI.LEVEL_COMPLETED,
			this.handleLevelCompleted,
		);
		this.options.eventBus?.off(
			EVENTS.UI.EXIT_ZONE_REACHED,
			this.handleExitZoneReached,
		);
	}

	handleExitZoneReached = () => {
		// Prevent multiple triggers
		if (this.isTransitioning) return;

		const { gameState, questController, commandBus } = this.options;
		if (commandBus && gameState && questController) {
			this.isTransitioning = true;
			commandBus
				.execute(
					new AdvanceChapterCommand({
						gameState,
						questController,
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
		const { gameState, questController, commandBus } = this.options;

		// 1. Hide dialog if open (handled by UI state, but ensures clean slate)
		gameState?.setShowDialog(false);

		// 2. Check if we should advance to next chapter
		const state = gameState?.getState();
		const hasNext = questController?.hasNextChapter();

		if (state?.isRewardCollected && hasNext) {
			this.logger?.info("📖 Advancing to next chapter");
			// Stop auto-move if any? (Handled by AdvanceChapterCommand presumably or logic)

			if (commandBus && gameState && questController) {
				commandBus.execute(
					new AdvanceChapterCommand({
						gameState,
						questController,
					}),
				);
			}
		} else {
			// Just mark item as collected/level complete state
			this.logger?.info("✅ Level Goal Reached (Item Collected)");
			gameState?.setCollectedItem(true);
		}
	};

	enableDebugMode() {
		this.logger?.info(`
🎮 DEBUG MODE ENABLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 'app.gameService.help()' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		`);

		// Show initial state
		this.options.gameService.getState();
	}
}
