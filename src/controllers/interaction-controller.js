import { ContextConsumer } from "@lit/context";
import { gameConfig } from "../config/game-configuration.js";
import { loggerContext } from "../contexts/logger-context.js";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { UIEvents } from "../core/events.js";
import { gameStoreContext } from "../core/store.js";

/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import('lit').ReactiveElement} ReactiveElement
 */

/**
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../types/services.d.js').IQuestController} IQuestController
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../use-cases/interact-with-npc.js').InteractWithNpcUseCase} InteractWithNpcUseCase
 */

/**
 * @typedef {Object} InteractionOptions
 * @property {number} [interactionDistance] - Max distance to interact (default: from config)
 * @property {InteractWithNpcUseCase} interactWithNpcUseCase
 */

/**
 * InteractionController - Handles NPC interaction logic
 *
 * Handles:
 * - Distance calculation to NPCs
 * - Proximity detection
 * - Interaction validation
 * - Dialog triggering
 *
 * @implements {ReactiveController}
 */
export class InteractionController {
	/** @type {ILoggerService | null} */
	#logger = null;
	/** @type {IQuestController | null} */
	#questController = null;
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestStateService | null} */
	#questState = null;

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {Partial<InteractionOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {ReactiveControllerHost} */
		this.host = host;
		/** @type {InteractionOptions} */
		this.options = {
			interactionDistance: gameConfig.gameplay.interactionDistance,
			interactWithNpcUseCase: /** @type {any} */ (null),
			...options,
		};

		if (!this.options.interactWithNpcUseCase) {
			throw new Error(
				"InteractionController requires interactWithNpcUseCase option",
			);
		}

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
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = /** @type {IQuestController} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: gameStoreContext,
			subscribe: true,
			callback: (store) => {
				if (store) {
					this.#heroState = store.hero;
					this.#questState = store.quest;
				}
			},
		});

		host.addController(this);
	}

	hostConnected() {}

	hostDisconnected() {}

	/**
	 * Calculate distance between hero and target
	 * @param {{x: number, y: number}} heroPos
	 * @param {{x: number, y: number} | null} [targetPos]
	 * @returns {number} Distance
	 */
	calculateDistance(heroPos, targetPos) {
		if (!targetPos) return Infinity;
		return Math.sqrt(
			(heroPos.x - targetPos.x) ** 2 + (heroPos.y - targetPos.y) ** 2,
		);
	}

	/**
	 * Check if hero is close to NPC
	 * @returns {boolean}
	 */
	isCloseToNpc() {
		const heroPos = this.#heroState?.pos.get();
		const npcPos = this.#questController?.currentChapter?.npc?.position;

		if (!heroPos || !npcPos) return false;

		const distance = this.calculateDistance(heroPos, npcPos);
		const maxDistance =
			this.options.interactionDistance ||
			gameConfig.gameplay.interactionDistance;
		return distance <= maxDistance;
	}

	/**
	 * Handle interaction attempt
	 */
	handleInteract() {
		if (!this.#heroState || !this.#questController || !this.#questState) {
			this.#logger?.warn?.("Cannot interact: Services not ready");
			return;
		}

		const isClose = this.isCloseToNpc();
		const currentChapter = this.#questController.currentChapter;

		const state = {
			level: currentChapter?.id || "",
			heroPos: this.#heroState.pos.get(),
			hotSwitchState: this.#heroState.hotSwitchState.get(),
			hasCollectedItem: this.#questState.hasCollectedItem.get(),
		};

		const result = this.options.interactWithNpcUseCase.execute({
			isClose,
			chapterData: /** @type {any} */ (currentChapter),
			gameState: state,
			hasCollectedItem: state.hasCollectedItem,
		});

		if (result.action === "showDialog") {
			this.#dispatchEvent(UIEvents.REQUEST_DIALOG);
		} else if (result.action === "showLocked") {
			this.#dispatchEvent(UIEvents.SHOW_LOCKED_MESSAGE, {
				message: result.message || null,
			});
		}
	}

	/**
	 * Helper to dispatch events from the host
	 * @param {string} eventName
	 * @param {any} [detail]
	 */
	#dispatchEvent(eventName, detail) {
		const host = /** @type {ReactiveElement} */ (
			/** @type {any} */ (this.host)
		);
		host.dispatchEvent(
			new CustomEvent(eventName, {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}
}
