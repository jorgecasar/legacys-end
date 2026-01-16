/**
 * CollectRewardCommand
 *
 * Command to mark a reward as collected.
 * Supports undo for debugging or state restoration.
 */
export class CollectRewardCommand {
	/**
	 * @param {Object} params
	 * @param {import('../game/interfaces.js').IQuestStateService} params.questState
	 */
	constructor({ questState }) {
		this.questState = questState;
		this.name = "CollectReward";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	execute() {
		this.questState.setIsRewardCollected(true);
	}

	/**
	 * Undo the command
	 */
	undo() {
		this.questState.setIsRewardCollected(false);
	}
}
