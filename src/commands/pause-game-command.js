/**
 * PauseGameCommand
 *
 * Command to pause/unpause the game.
 * Supports undo to restore previous pause state.
 */
export class PauseGameCommand {
	/**
	 * @param {Object} params
	 * @param {import('../game/interfaces.js').IWorldStateService} params.worldState
	 */
	constructor({ worldState }) {
		this.worldState = worldState;
		/** @type {boolean | null} */
		this.previousPauseState = null;
		this.name = "PauseGame";
		this.metadata = {};
	}

	/**
	 * Execute the pause toggle
	 */
	execute() {
		this.previousPauseState = this.worldState.isPaused.get();
		this.worldState.setPaused(!this.previousPauseState);
		this.metadata = { newState: !this.previousPauseState };
	}

	/**
	 * Undo the pause toggle
	 */
	undo() {
		if (this.previousPauseState !== null) {
			this.worldState.setPaused(this.previousPauseState);
		}
	}
}
