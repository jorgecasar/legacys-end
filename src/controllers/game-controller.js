import { ContextConsumer } from "@lit/context";
import { loggerContext } from "../contexts/logger-context.js";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { heroStateContext } from "../game/contexts/hero-context.js";
import { questStateContext } from "../game/contexts/quest-context.js";
import { worldStateContext } from "../game/contexts/world-context.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 */

/**
 * @typedef {import('../services/interfaces.js').ILoggerService} ILoggerService
 * @typedef {import('../game/interfaces.js').IHeroStateService} IHeroStateService
 * @typedef {import('../game/interfaces.js').IQuestStateService} IQuestStateService
 * @typedef {import('../game/interfaces.js').IWorldStateService} IWorldStateService
 * @typedef {import('../services/interfaces.js').IQuestController} IQuestController
 */

/**
 * @typedef {Object} GameControllerOptions
 * @property {boolean} [exposeToConsole=true] - Whether to expose game controller to console as window.game
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
	/** @type {ILoggerService | null} */
	#logger = null;
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestStateService | null} */
	#questState = null;
	/** @type {IWorldStateService | null} */
	#worldState = null;
	/** @type {IQuestController | null} */
	#questController = null;

	/**
	 * Private getter for search params
	 * @returns {URLSearchParams}
	 */
	get #searchParams() {
		return new URLSearchParams(window.location.search);
	}

	/**
	 * Private setter/getter for global game variable
	 * @type {any}
	 */
	get #globalGame() {
		// @ts-expect-error - window.game is a custom global for debugging
		return window.game;
	}

	set #globalGame(value) {
		// @ts-expect-error - window.game is a custom global for debugging
		window.game = value;
	}

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {GameControllerOptions} [options]
	 */
	constructor(host, options = {}) {
		/** @type {ReactiveControllerHost} */
		this.host = host;
		this.options = {
			exposeToConsole: true,
			...options,
		};
		this.isEnabled = this.#searchParams.has("debug");
		/** @type {boolean} */
		this.isTransitioning = false;

		const hostElement = /** @type {ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Initialize Context Consumers
		new ContextConsumer(hostElement, {
			context: loggerContext,
			subscribe: true,
			callback: (service) => {
				this.#logger = /** @type {ILoggerService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: heroStateContext,
			subscribe: true,
			callback: (service) => {
				this.#heroState = /** @type {IHeroStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: questStateContext,
			subscribe: true,
			callback: (service) => {
				this.#questState = /** @type {IQuestStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: worldStateContext,
			subscribe: true,
			callback: (service) => {
				this.#worldState = /** @type {IWorldStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = /** @type {IQuestController} */ (service);
			},
		});

		host.addController(this);
	}

	hostConnected() {
		if (this.isEnabled) {
			this.enableDebugMode();
		}
		if (this.options.exposeToConsole) {
			this.#globalGame = this;
		}
	}

	hostDisconnected() {}

	handleExitZoneReached() {
		// Prevent multiple triggers
		if (this.isTransitioning) return;

		if (this.#heroState && this.#questController) {
			this.isTransitioning = true;
			this.#questController.advanceChapter().finally(() => {
				// Reset flag after a delay or let the next chapter load reset it naturally
				// For now, we keep it true until the next chapter or reset happens externally
				setTimeout(() => {
					this.isTransitioning = false;
				}, 2000);
			});
		}
	}

	/**
	 * Handle level completion event
	 * Executes logic to advance chapter or complete quest
	 */
	handleLevelCompleted = () => {
		// 1. Hide dialog if open (handled by UI state, but ensures clean slate)
		this.#worldState?.setShowDialog(false);

		// 2. Mark item as collected (triggers reward animation in viewport)
		this.#logger?.info("✅ Level Goal Reached (Item Collected)");
		this.#questState?.setHasCollectedItem(true);

		// 3. Advance to next chapter ONLY if there is NO exit zone
		// If there is an exit zone, CollisionController will trigger advancement when reached.
		const currentChapter = this.#questController?.currentChapter;
		if (!currentChapter?.exitZone) {
			this.#logger?.info("📖 No exit zone, advancing...");
			if (this.#questController) {
				this.#questController.advanceChapter();
			}
		}
	};

	enableDebugMode() {
		this.#logger?.info(`
		🎮 DEBUG MODE ENABLED
		━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		Type 'app.questController.help()' for available commands
		━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				`);
	}
}
