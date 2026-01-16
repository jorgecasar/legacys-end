/**
 * ContinueQuestCommand
 *
 * Command wrapper for ContinueQuestUseCase.
 * Provides command interface for continuing quests.
 */
export class ContinueQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/quest-loader-service.js').QuestLoaderService} params.questLoader
	 * @param {string} params.questId
	 */
	constructor({ questLoader, questId }) {
		this.questLoader = questLoader;
		this.questId = questId;
		this.name = "ContinueQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.questLoader.continueQuest(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to continue quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
