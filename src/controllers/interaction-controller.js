/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { gameConfig } from "../config/game-configuration.js";

/**
 * @typedef {import('../game/interfaces.js').HotSwitchState} HotSwitchState
 * @typedef {import('../content/quests/quest-types.js').LevelConfig} LevelConfig

 * @typedef {import('../game/interfaces.js').IWorldStateService} WorldStateService
 * @typedef {import('../game/interfaces.js').IQuestStateService} QuestStateService
 */

/**
 * @typedef {Object} InteractionState
 * @property {string} level - Current level ID
 * @property {LevelConfig} [chapterData] - Configuration for key game objects
 * @property {{x: number, y: number}} heroPos - Current hero position {x,y}
 * @property {HotSwitchState} hotSwitchState - API context state
 * @property {boolean} hasCollectedItem - Whether reward is collected
 */

/**
 * @typedef {Object} InteractionOptions

 * @property {WorldStateService} [worldState] - World state service (UI, Pause)
 * @property {QuestStateService} [questState] - Quest state service (Locked messages)
 * @property {number} [interactionDistance] - Max distance to interact (default: from config)
 * @property {() => InteractionState} [getState] - Accessor for game state
 * @property {() => ({x: number, y: number}|null|undefined)} [getNpcPosition] - Accessor for NPC coordinates
 * @property {import('../use-cases/interact-with-npc.js').InteractWithNpcUseCase} interactWithNpcUseCase
 */

/**
 * InteractionController - Handles NPC interaction logic
 *
 * Handles:
 * - Distance calculation to NPCs
 * - Proximity detection
 * - Interaction validation (Level 6 victory conditions)
 * - Dialog triggering
 *
 * @implements {ReactiveController}
 */
export class InteractionController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<InteractionOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {InteractionOptions} */
		this.options = {
			interactionDistance: gameConfig.gameplay.interactionDistance,
			getState: () => ({
				level: "",
				heroPos: { x: 0, y: 0 },
				hotSwitchState: null,
				hasCollectedItem: false,
			}),
			getNpcPosition: () => null,
			interactWithNpcUseCase: /** @type {any} */ (null),
			...options,
		};

		if (!this.options.interactWithNpcUseCase) {
			throw new Error(
				"InteractionController requires interactWithNpcUseCase option",
			);
		}

		host.addController(this);
	}

	hostConnected() {
		// keeping for interface consistency, though empty
	}

	hostDisconnected() {
		// keeping for interface consistency, though empty
	}

	/**
	 * Calculate distance between hero and target
	 * @param {{x: number, y: number}} heroPos
	 * @param {{x: number, y: number}} [targetPos]
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
		const state = this.options.getState?.();
		const npcPos = this.options.getNpcPosition?.();

		if (!state?.heroPos || !npcPos) return false;

		const distance = this.calculateDistance(state.heroPos, npcPos);
		const maxDistance =
			this.options.interactionDistance ||
			gameConfig.gameplay.interactionDistance;
		return distance <= maxDistance;
	}

	/**
	 * Handle interaction attempt
	 */
	handleInteract() {
		const state = this.options.getState?.();
		if (!state) return;

		const isClose = this.isCloseToNpc();
		const { chapterData, hasCollectedItem } = state;

		const result = this.options.interactWithNpcUseCase.execute({
			isClose,
			chapterData,
			gameState: state,
			hasCollectedItem,
		});

		if (result.action === "showDialog") {
			/** @type {HTMLElement} */ (
				/** @type {unknown} */ (this.host)
			).dispatchEvent(
				new CustomEvent("request-dialog", {
					bubbles: true,
					composed: true,
				}),
			);
		} else if (result.action === "showLocked") {
			/** @type {HTMLElement} */ (
				/** @type {unknown} */ (this.host)
			).dispatchEvent(
				new CustomEvent("show-locked-message", {
					detail: { message: result.message || null },
					bubbles: true,
					composed: true,
				}),
			);
		}
	}
}
