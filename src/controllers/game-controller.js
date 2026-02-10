import { ContextConsumer } from "@lit/context";
import { loggerContext } from "../contexts/logger-context.js";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { gameStoreContext } from "../core/store.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 */

/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/services.d.js').IQuestController} IQuestController
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
	 * @param {ReactiveControllerHost & HTMLElement} host
	 * @param {GameControllerOptions} [options]
	 */
	constructor(host, options = {}) {
		/** @type {ReactiveControllerHost & HTMLElement} */
		this.host = host;
		this.options = {
			...options,
		};
		this.isEnabled = this.#searchParams.has("debug");
		/** @type {boolean} */
		this.isTransitioning = false;

		// Initialize Context Consumers
		new ContextConsumer(this.host, {
			context: loggerContext,
			subscribe: true,
			callback: (service) => {
				this.#logger = /** @type {ILoggerService} */ (service);
			},
		});

		new ContextConsumer(this.host, {
			context: gameStoreContext,
			subscribe: true,
			callback: (store) => {
				if (store) {
					this.#heroState = store.hero;
				}
			},
		});

		new ContextConsumer(this.host, {
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
		if (this.#questController) {
			this.#questController.completeChapter();
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
