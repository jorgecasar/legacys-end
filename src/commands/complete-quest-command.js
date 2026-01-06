/**
 * CompleteQuestCommand
 *
 * Command wrapper for CompleteQuestUseCase.
 * Provides command interface for completing quests.
 */
export class CompleteQuestCommand {
	/**
	 * @param {Object} params
	 * @param {import('../use-cases/complete-quest.js').CompleteQuestUseCase} params.completeQuestUseCase
	 */
	constructor({ completeQuestUseCase }) {
		this.completeQuestUseCase = completeQuestUseCase;
		this.name = "CompleteQuest";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	execute() {
		const result = this.completeQuestUseCase.execute();
		if (!result.success) {
			throw result.error || new Error("Failed to complete quest");
		}
		return result;
	}

	// Note: Quest operations typically don't support undo
}
