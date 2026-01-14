/**
 * ContinueQuestCommand
 *
 * Command wrapper for ContinueQuestUseCase.
 * Provides command interface for continuing quests.
 */
export class ContinueQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../managers/game-session-manager.js').GameSessionManager} params.sessionManager
	 * @param {string} params.questId
	 */
	constructor({ sessionManager, questId }) {
		this.sessionManager = sessionManager;
		this.questId = questId;
		this.name = "ContinueQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.sessionManager.continueQuest(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to continue quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
