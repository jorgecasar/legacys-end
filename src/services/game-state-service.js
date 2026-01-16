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
	}

	/**
	 * @deprecated Use specialized services (HeroState, QuestState, WorldState)
	 * Get a snapshot of the current state for legacy consumers.
	 * @returns {any} The current state object
	 */
	getState() {
		return {};
	}

	// Wrapper for backward compatibility if needed, though we prefer direct setting
	// Note: setState is removed in favor of specific methods to enforce strictness

	// --- Convenience Methods ---

	/**
	 * @param {import('../game/services/hero-state-service.js').HeroStateService} heroState
	 * @param {import('../game/services/quest-state-service.js').QuestStateService} questState
	 * @param {import('../game/services/world-state-service.js').WorldStateService} worldState
	 */
	setDomainServices(heroState, questState, worldState) {
		this.heroState = heroState;
		this.questState = questState;
		this.worldState = worldState;
	}

	/**
	 * Update the hero's position on the game board.
	 * @param {number} x - X coordinate percentage (0-100)
	 * @param {number} y - Y coordinate percentage (0-100)
	 */
	setHeroPosition(x, y) {
		this.heroState?.setPos(x, y);
	}

	/**
	 * Set whether the objective item for the current chapter has been collected.
	 * @param {boolean} collected - True if collected
	 */
	setCollectedItem(collected) {
		this.questState?.setHasCollectedItem(collected);
	}

	/**
	 * Set the status of the reward collection animation sequence.
	 * @param {boolean} collected - True if the reward animation is finished
	 */
	setRewardCollected(collected) {
		this.questState?.setIsRewardCollected(collected);
	}

	/**
	 * Change the active Service Context (Demonstrated in Level 6).
	 * This simulates switching between different backend API implementations.
	 * @param {import('./game-state-service.js').HotSwitchState} state - The context identifier
	 */
	setHotSwitchState(state) {
		this.heroState?.setHotSwitchState(state);
	}

	/**
	 * Pause or resume the game.
	 * @param {boolean} paused - True to pause
	 */
	setPaused(paused) {
		this.worldState?.setPaused(paused);
	}

	/**
	 * Set the evolve state.
	 * @param {boolean} evolving
	 */
	setEvolving(evolving) {
		this.heroState?.setIsEvolving(evolving);
	}

	/**
	 * Set show dialog state.
	 * @param {boolean} show
	 */
	setShowDialog(show) {
		this.worldState?.setShowDialog(show);
	}

	/**
	 * Set quest completed state.
	 * @param {boolean} completed
	 */
	setQuestCompleted(completed) {
		this.questState?.setIsQuestCompleted(completed);
	}

	/**
	 * Set a feedback message to display when a user action is blocked.
	 * @param {string|null} message - The message to display, or null to clear
	 */
	setLockedMessage(message) {
		this.questState?.setLockedMessage(message);
	}

	/**
	 * Reset the ephemeral state for a new chapter.
	 * Clears collected items, messages, and evolution flags.
	 * Does NOT reset hero position or persistent progress.
	 */
	resetChapterState() {
		this.questState?.resetChapterState();
		this.heroState?.setIsEvolving(false);
		this.worldState?.setCurrentDialogText("");
	}

	/**
	 * Reset the ephemeral state for a new quest.
	 * Clears quest completion flags in addition to chapter state.
	 */
	resetQuestState() {
		this.questState?.resetQuestState();
		this.heroState?.setIsEvolving(false);
	}

	/**
	 * Set the text of the currently active dialog slide.
	 * @param {string} text - The dialog text
	 */
	setCurrentDialogText(text) {
		this.worldState?.setCurrentDialogText(text);
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
