/**
 * StartQuestCommand
 *
 * Command wrapper for StartQuestUseCase.
 * Provides command interface for starting quests.
 */
export class StartQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../use-cases/start-quest.js').StartQuestUseCase} params.startQuestUseCase
	 * @param {string} params.questId
	 */
	constructor({ startQuestUseCase, questId }) {
		this.startQuestUseCase = startQuestUseCase;
		this.questId = questId;
		this.name = "StartQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.startQuestUseCase.execute(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to start quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
