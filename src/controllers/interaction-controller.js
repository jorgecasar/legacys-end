/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { gameConfig } from "../config/game-configuration.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";

/**
 * @typedef {import('../services/game-state-service.js').HotSwitchState} HotSwitchState
 * @typedef {import('../content/quests/quest-types.js').LevelConfig} LevelConfig
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
 * @property {number} [interactionDistance] - Max distance to interact (default: from config)
 * @property {() => void} [onShowDialog] - Callback to open dialog
 * @property {() => void} [onVictory] - Verification callback
 * @property {(msg: string|null) => void} [onLocked] - Callback for locked features
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
			onShowDialog: () => {},
			onVictory: () => {},
			onLocked: (/** @type {string|null} */ _msg) => {},
			getState: () => ({
				level: "",
				heroPos: { x: 0, y: 0 },
				hotSwitchState: null,
				hasCollectedItem: false,
			}),
			getNpcPosition: () => null,
			interactWithNpcUseCase: new InteractWithNpcUseCase(),
			...options,
		};

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
		const { chapterData, hotSwitchState, hasCollectedItem } = state;

		const result = this.options.interactWithNpcUseCase.execute({
			isClose,
			chapterData,
			hotSwitchState: hotSwitchState || "legacy",
			hasCollectedItem,
		});

		if (result.action === "showDialog") {
			this.options.onShowDialog?.();
		} else if (result.action === "showLocked") {
			this.options.onLocked?.(result.message || null);
			setTimeout(() => this.options.onLocked?.(null), 1000);
		}
	}
}
