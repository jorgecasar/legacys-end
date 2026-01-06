/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

const DEFAULT_INTERACTION_DISTANCE = 15;

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
 * @property {number} [interactionDistance] - Max distance to interact (default: 15)
 * @property {() => void} [onShowDialog] - Callback to open dialog
 * @property {() => void} [onVictory] - Verification callback
 * @property {(msg: string|null) => void} [onLocked] - Callback for locked features
 * @property {() => InteractionState} [getState] - Accessor for game state
 * @property {() => ({x: number, y: number}|null|undefined)} [getNpcPosition] - Accessor for NPC coordinates
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
			interactionDistance: DEFAULT_INTERACTION_DISTANCE,
			onShowDialog: () => {},
			onVictory: () => {},
			onLocked: () => {},
			getState: () => ({
				level: "",
				heroPos: { x: 0, y: 0 },
				hotSwitchState: /** @type {HotSwitchState} */ (null),
				hasCollectedItem: false,
			}),
			getNpcPosition: () => null,
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
		const state = this.options.getState();
		const npcPos = this.options.getNpcPosition();
		const distance = this.calculateDistance(state.heroPos, npcPos);
		return (
			distance <
			(this.options.interactionDistance || DEFAULT_INTERACTION_DISTANCE)
		);
	}

	/**
	 * Handle interaction attempt
	 */
	handleInteract() {
		const state = this.options.getState();
		const isClose = this.isCloseToNpc();
		const { chapterData, hotSwitchState, hasCollectedItem } = state;

		// Final Boss Victory condition check
		if (chapterData?.isFinalBoss && isClose) {
			if (hotSwitchState === "new") {
				// Allow dialog to open for final victory sequence
				this.options.onShowDialog();
			} else {
				this.options.onLocked("REQ: NEW API");
				setTimeout(() => this.options.onLocked(null), 1000);
			}
			return;
		}

		// Regular interaction
		if (isClose && !hasCollectedItem) {
			this.options.onShowDialog();
		}
	}
}
