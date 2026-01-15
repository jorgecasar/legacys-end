import { Signal } from "@lit-labs/signals";
import {
	HotSwitchStateValidator,
	PositionValidator,
} from "../utils/validators.js";

/**
 * @typedef {{
 * 	heroPos: {x: number, y: number},
 * 	hasCollectedItem: boolean,
 * 	isRewardCollected: boolean,
 * 	hotSwitchState: HotSwitchState,
 * 	isPaused: boolean,
 * 	isEvolving: boolean,
 * 	showDialog: boolean,
 * 	isQuestCompleted: boolean,
 * 	lockedMessage: string|null,
 * 	currentDialogText: string
 * }} GameState
 */

/** @typedef {import('./interfaces.js').IGameStateService} IGameStateService */

/**
 * @typedef {Object} HeroPosition
 * @property {number} x - X coordinate percentage (0-100)
 * @property {number} y - Y coordinate percentage (0-100)
 */

/**
 * @typedef {'legacy' | 'new' | 'mock' | null} HotSwitchState
 */

/**
 * GameStateService - Manages ephemeral game state using Lit Signals
 *
 * Tracks:
 * - Hero position
 * - Collected items (per session/chapter)
 * - Active context (hot switch state)
 * - UI state (paused, evolving, locked messages)
 *
 * Implements IGameStateService interface (see interfaces.js)
 * @implements {IGameStateService}
 */
export class GameStateService {
	/**
	 * @param {import('./logger-service.js').LoggerService} [logger] - Logger service
	 */
	constructor(logger = undefined) {
		this.logger = logger;
		// Define signals for reactive state
		this.heroPos = new Signal.State({ x: 50, y: 15 });
		this.hasCollectedItem = new Signal.State(false);
		this.isRewardCollected = new Signal.State(false);
		this.hotSwitchState = new Signal.State(
			/** @type {HotSwitchState} */ (null),
		);
		this.isPaused = new Signal.State(false);
		this.isEvolving = new Signal.State(false);
		this.showDialog = new Signal.State(false);
		this.isQuestCompleted = new Signal.State(false);
		this.lockedMessage = new Signal.State(/** @type {string|null} */ (null));
		this.currentDialogText = new Signal.State("");
	}

	/**
	 * Get a snapshot of the current state for legacy consumers.
	 * @returns {GameState} The current state object
	 */
	getState() {
		return {
			heroPos: this.heroPos.get(),
			hasCollectedItem: this.hasCollectedItem.get(),
			isRewardCollected: this.isRewardCollected.get(),
			hotSwitchState: this.hotSwitchState.get(),
			isPaused: this.isPaused.get(),
			isEvolving: this.isEvolving.get(),
			showDialog: this.showDialog.get(),
			isQuestCompleted: this.isQuestCompleted.get(),
			lockedMessage: this.lockedMessage.get(),
			currentDialogText: this.currentDialogText.get(),
		};
	}

	// Wrapper for backward compatibility if needed, though we prefer direct setting
	// Note: setState is removed in favor of specific methods to enforce strictness

	// --- Convenience Methods ---

	/**
	 * Update the hero's position on the game board.
	 * @param {number} x - X coordinate percentage (0-100)
	 * @param {number} y - Y coordinate percentage (0-100)
	 * @throws {Error} If position is invalid
	 */
	setHeroPosition(x, y) {
		const validation = PositionValidator.validate(x, y);
		if (!validation.isValid) {
			const errors = validation.errors.map((e) => e.message).join(", ");
			throw new Error(`Invalid hero position: ${errors}`);
		}
		this.heroPos.set({ x, y });
	}

	/**
	 * Set whether the objective item for the current chapter has been collected.
	 * @param {boolean} collected - True if collected
	 */
	setCollectedItem(collected) {
		this.hasCollectedItem.set(collected);
	}

	/**
	 * Set the status of the reward collection animation sequence.
	 * @param {boolean} collected - True if the reward animation is finished
	 */
	setRewardCollected(collected) {
		this.isRewardCollected.set(collected);
	}

	/**
	 * Change the active Service Context (Demonstrated in Level 6).
	 * This simulates switching between different backend API implementations.
	 * @param {HotSwitchState} state - The context identifier
	 * @throws {Error} If state is invalid
	 */
	setHotSwitchState(state) {
		const validation = HotSwitchStateValidator.validate(state);
		if (!validation.isValid) {
			const errors = validation.errors.map((e) => e.message).join(", ");
			throw new Error(`Invalid hot switch state: ${errors}`);
		}
		this.hotSwitchState.set(state);
	}

	/**
	 * Pause or resume the game.
	 * @param {boolean} paused - True to pause
	 */
	setPaused(paused) {
		this.isPaused.set(paused);
	}

	/**
	 * Set the evolve state.
	 * @param {boolean} evolving
	 */
	setEvolving(evolving) {
		this.isEvolving.set(evolving);
	}

	/**
	 * Set show dialog state.
	 * @param {boolean} show
	 */
	setShowDialog(show) {
		this.showDialog.set(show);
	}

	/**
	 * Set quest completed state.
	 * @param {boolean} completed
	 */
	setQuestCompleted(completed) {
		this.isQuestCompleted.set(completed);
	}

	/**
	 * Set a feedback message to display when a user action is blocked.
	 * @param {string|null} message - The message to display, or null to clear
	 */
	setLockedMessage(message) {
		this.lockedMessage.set(message);
	}

	/**
	 * Reset the ephemeral state for a new chapter.
	 * Clears collected items, messages, and evolution flags.
	 * Does NOT reset hero position or persistent progress.
	 */
	resetChapterState() {
		this.hasCollectedItem.set(false);
		this.isRewardCollected.set(false);
		this.lockedMessage.set(null);
		this.isEvolving.set(false);
		this.currentDialogText.set("");
	}

	/**
	 * Reset the ephemeral state for a new quest.
	 * Clears quest completion flags in addition to chapter state.
	 */
	resetQuestState() {
		this.resetChapterState();
		this.isQuestCompleted.set(false);
	}

	/**
	 * Set the text of the currently active dialog slide.
	 * @param {string} text - The dialog text
	 */
	setCurrentDialogText(text) {
		this.currentDialogText.set(text || "");
	}

	// Deprecated methods that we might need to keep temporarily for external callers (if any exist beyond those we fix)
	/**
	 * @deprecated Use signals directly.
	 * @param {(state: any, oldState: any) => void} _callback
	 * @returns {Function} Unsubscribe function (no-op)
	 */
	subscribe(_callback) {
		// Warning: This is a hacky compatibility shim.
		// We will maintain it for now until consumers are updated
		this.logger?.warn(
			"GameStateService.subscribe is deprecated. Use signals directly.",
		);
		return () => {};
	}
}
