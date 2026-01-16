/**
 * StartQuestCommand
 *
 * Command wrapper for StartQuestUseCase.
 * Provides command interface for starting quests.
 */
export class StartQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/quest-loader-service.js').QuestLoaderService} params.questLoader
	 * @param {string} params.questId
	 */
	constructor({ questLoader, questId }) {
		this.questLoader = questLoader;
		this.questId = questId;
		this.name = "StartQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.questLoader.startQuest(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to start quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
