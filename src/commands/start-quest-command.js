/**
 * StartQuestCommand
 *
 * Command wrapper for StartQuestUseCase.
 * Provides command interface for starting quests.
 */
export class StartQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../managers/game-session-manager.js').GameSessionManager} params.sessionManager
	 * @param {string} params.questId
	 */
	constructor({ sessionManager, questId }) {
		this.sessionManager = sessionManager;
		this.questId = questId;
		this.name = "StartQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.sessionManager.startQuest(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to start quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
