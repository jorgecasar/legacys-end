/**
 * ToggleHotSwitchCommand
 *
 * Command to toggle between legacy and new API contexts.
 * Supports undo to restore previous state.
 */
export class ToggleHotSwitchCommand {
	/**
	 * @param {Object} params
	 * @param {import('../game/interfaces.js').IHeroStateService} params.heroState
	 */
	constructor({ heroState }) {
		this.heroState = heroState;
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
		this.previousState = this.heroState.hotSwitchState.get();
		const newState = this.previousState === "legacy" ? "new" : "legacy";
		this.heroState.setHotSwitchState(newState);
		this.metadata.newState = newState;
	}

	/**
	 * Undo the toggle
	 */
	undo() {
		if (this.previousState !== null) {
			this.heroState.setHotSwitchState(this.previousState);
		}
	}
}
