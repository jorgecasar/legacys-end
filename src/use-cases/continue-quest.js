/**
 * ContinueQuestUseCase
 *
 * Business logic for continuing an in-progress quest.
 * Loads saved progress and resumes from the last checkpoint.
 */
export class ContinueQuestUseCase {
	/**
	 * @param {Object} dependencies
	 * @param {import('../controllers/quest-controller.js').QuestController} dependencies.questController
	 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
	 */
	constructor({ questController, logger }) {
		this.questController = questController;
		this.logger = logger;
	}

	/**
	 * Execute the use case
	 * @param {string} questId - ID of the quest to continue
	 * @returns {Promise<{success: boolean, quest: any, error?: Error}>}
	 */
	async execute(questId) {
		try {
			// Continue the quest through the controller
			await this.questController.continueQuest(questId);
			const quest = this.questController.currentQuest;

			return { success: true, quest };
		} catch (error) {
			this.logger.error("Failed to continue quest:", error);

			return {
				success: false,
				quest: null,
				error: /** @type {Error} */ (error),
			};
		}
	}
}
