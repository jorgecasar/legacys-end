import { ServiceType } from '../types.js'; // Assuming ServiceType is needed or will use string

const DEFAULT_INTERACTION_DISTANCE = 15;

/**
 * InteractionController - Handles NPC interaction logic
 * 
 * Handles:
 * - Distance calculation to NPCs
 * - Proximity detection
 * - Interaction validation (Level 6 victory conditions)
 * - Dialog triggering
 * 
 * Usage:
 * ```js
 * this.interaction = new InteractionController(this, {
 *   onShowDialog: () => { this.showDialog = true; },
 *   onVictory: () => { this.hasCollectedItem = true; },
 *   onLocked: (message) => { this.lockedMessage = message; },
 *   getState: () => ({
 *     level: this.level,
 *     chapterData: this.getChapterData(this.level),
 *     heroPos: this.heroPos,
 *     hotSwitchState: this.hotSwitchState,
 *     hasCollectedItem: this.hasCollectedItem
 *   }),
 *   getNpcPosition: () => currentConfig.npc?.position
 * });
 * 
 * // Handle interaction
 * this.interaction.handleInteract();
 * ```
 */
export class InteractionController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			interactionDistance: DEFAULT_INTERACTION_DISTANCE,
			onShowDialog: () => { },
			onVictory: () => { },
			onLocked: () => { },
			getState: () => ({}),
			getNpcPosition: () => null,
			...options
		};

		host.addController(this);
	}

	hostConnected() {
		// No setup needed
	}

	hostDisconnected() {
		// No cleanup needed
	}

	/**
	 * Calculate distance between hero and target
	 * @param {Object} heroPos - {x, y}
	 * @param {Object} targetPos - {x, y}
	 * @returns {number} Distance
	 */
	calculateDistance(heroPos, targetPos) {
		if (!targetPos) return Infinity;
		return Math.sqrt(
			Math.pow(heroPos.x - targetPos.x, 2) +
			Math.pow(heroPos.y - targetPos.y, 2)
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
		return distance < this.options.interactionDistance;
	}

	/**
	 * Handle interaction attempt
	 */
	handleInteract() {
		const state = this.options.getState();
		const isClose = this.isCloseToNpc();
		const { chapterData, hotSwitchState, hasCollectedItem } = state;

		// Final Boss Victory condition check
		if (chapterData && chapterData.isFinalBoss && isClose) {
			if (hotSwitchState === 'new') {
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
