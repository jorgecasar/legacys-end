/**
 * StartQuestUseCase
 *
 * Business logic for starting a new quest from the hub.
 * Coordinates between quest controller, state management, and navigation.
 */
export class StartQuestUseCase {
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
	 * @param {string} questId - ID of the quest to start
	 * @returns {Promise<{success: boolean, quest: any, error?: Error}>}
	 */
	async execute(questId) {
		try {
			// Start the quest through the controller
			await this.questController.startQuest(questId);
			const quest = this.questController.currentQuest;

			return { success: true, quest };
		} catch (error) {
			this.logger.error("Failed to start quest:", error);

			return {
				success: false,
				quest: null,
				error: /** @type {Error} */ (error),
			};
		}
	}
}
