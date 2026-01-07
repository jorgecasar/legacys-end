/**
 * ToggleHotSwitchCommand
 *
 * Command to toggle between legacy and new API contexts.
 * Supports undo to restore previous state.
 */
export class ToggleHotSwitchCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/game-state-service.js').GameStateService} params.gameState
	 */
	constructor({ gameState }) {
		this.gameState = gameState;
		/** @type {import('../services/game-state-service.js').HotSwitchState} */
		this.previousState = null;
		this.name = "ToggleHotSwitch";
		/** @type {Object<string, any>} */
		this.metadata = {};
	}

	/**
	 * Execute the toggle
	 */
	execute() {
		const state = this.gameState.getState();
		this.previousState = state.hotSwitchState;
		const newState = this.previousState === "legacy" ? "new" : "legacy";
		this.gameState.setHotSwitchState(newState);
		this.metadata.newState = newState;
	}

	/**
	 * Undo the toggle
	 */
	undo() {
		if (this.previousState !== undefined) {
			this.gameState.setHotSwitchState(this.previousState);
		}
	}
}
