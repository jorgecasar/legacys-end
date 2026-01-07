import { ROUTES } from "../constants/routes.js";
import { logger } from "../services/logger-service.js";

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
	 * @param {import('../utils/router.js').Router} dependencies.router
	 */
	constructor({ questController, router }) {
		this.questController = questController;
		this.router = router;
	}

	/**
	 * Execute the use case
	 * @param {boolean} replace - Whether to replace history entry
	 * @returns {{success: boolean, error?: Error}}
	 */
	execute(replace = false) {
		try {
			logger.info("🏛️ Returning to Hub");

			// Reset quest controller if needed
			if (this.questController?.currentQuest) {
				this.questController.returnToHub();
			}

			// Navigate if we have a router and are not already at the hub URL
			if (this.router && this.router.currentPath !== ROUTES.HUB) {
				this.router.navigate(ROUTES.HUB, replace);
			}

			return { success: true };
		} catch (error) {
			logger.error("Failed to return to hub:", error);
			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}
}
