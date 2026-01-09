/**
 * PauseGameCommand
 *
 * Command to pause/unpause the game.
 * Supports undo to restore previous pause state.
 */
export class PauseGameCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/game-state-service.js').GameStateService} params.gameState
	 */
	constructor({ gameState }) {
		this.gameState = gameState;
		/** @type {boolean | null} */
		this.previousPauseState = null;
		this.name = "PauseGame";
		this.metadata = {};
	}

	/**
	 * Execute the pause toggle
	 */
	execute() {
		const state = this.gameState.getState();
		this.previousPauseState = state.isPaused;
		this.gameState.setPaused(!state.isPaused);
		this.metadata = { newState: !state.isPaused };
	}

	/**
	 * Undo the pause toggle
	 */
	undo() {
		if (this.previousPauseState !== null) {
			this.gameState.setPaused(this.previousPauseState);
		}
	}
}
