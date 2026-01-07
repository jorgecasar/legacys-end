/**
 * CollectRewardCommand
 *
 * Command to mark a reward as collected.
 * Supports undo for debugging or state restoration.
 */
export class CollectRewardCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/game-state-service.js').GameStateService} params.gameState
	 */
	constructor({ gameState }) {
		this.gameState = gameState;
		this.name = "CollectReward";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	execute() {
		this.gameState.setRewardCollected(true);
	}

	/**
	 * Undo the command
	 */
	undo() {
		this.gameState.setRewardCollected(false);
	}
}
