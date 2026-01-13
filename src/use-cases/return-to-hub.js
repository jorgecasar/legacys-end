/**
 * ReturnToHubUseCase
 *
 * Business logic for returning to the hub from a quest.
 * Handles cleanup, state reset, and navigation.
 */
export class ReturnToHubUseCase {
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
	 * @returns {{success: boolean, error?: Error}}
	 */
	execute(_replace = false) {
		try {
			this.logger.info("🏛️ Returning to Hub");

			// Reset quest controller if needed
			if (this.questController?.currentQuest) {
				this.questController.returnToHub();
			}

			return { success: true };
		} catch (error) {
			this.logger.error("Failed to return to hub:", error);
			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}
}
