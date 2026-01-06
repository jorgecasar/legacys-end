/**
 * ContinueQuestCommand
 *
 * Command wrapper for ContinueQuestUseCase.
 * Provides command interface for continuing quests.
 */
export class ContinueQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../use-cases/continue-quest.js').ContinueQuestUseCase} params.continueQuestUseCase
	 * @param {string} params.questId
	 */
	constructor({ continueQuestUseCase, questId }) {
		this.continueQuestUseCase = continueQuestUseCase;
		this.questId = questId;
		this.name = "ContinueQuest";
		this.metadata = { questId };
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = await this.continueQuestUseCase.execute(this.questId);
		if (!result.success) {
			throw result.error || new Error("Failed to continue quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
