import { GameEvents } from "../core/event-bus.js";

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
	 * @param {import('../core/event-bus.js').EventBus} dependencies.eventBus
	 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
	 */
	constructor({ questController, eventBus, logger }) {
		this.questController = questController;
		this.eventBus = eventBus;
		this.logger = logger;
	}

	/**
	 * Execute the use case
	 * @param {string} questId - ID of the quest to continue
	 * @returns {Promise<{success: boolean, quest: any, error?: Error}>}
	 */
	async execute(questId) {
		try {
			// Emit loading start event
			this.eventBus.emit(GameEvents.LOADING_START, { source: "continueQuest" });

			// Continue the quest through the controller
			await this.questController.continueQuest(questId);
			const quest = this.questController.currentQuest;

			// Emit navigation event

			return { success: true, quest };
		} catch (error) {
			this.logger.error("Failed to continue quest:", error);

			// Emit error event
			this.eventBus.emit(GameEvents.ERROR, {
				message: "Failed to continue quest",
				error,
				context: { questId },
			});

			return {
				success: false,
				quest: null,
				error: /** @type {Error} */ (error),
			};
		} finally {
			// Always emit loading end
			this.eventBus.emit(GameEvents.LOADING_END, { source: "continueQuest" });
		}
	}
}
