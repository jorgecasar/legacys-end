import { GameEvents } from "../core/event-bus.js";

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
	 * @param {string} questId - ID of the quest to start
	 * @returns {Promise<{success: boolean, quest: any, error?: Error}>}
	 */
	async execute(questId) {
		try {
			// Emit loading start event
			this.eventBus.emit(GameEvents.LOADING_START, { source: "startQuest" });

			// Start the quest through the controller
			await this.questController.startQuest(questId);
			const quest = this.questController.currentQuest;

			// Emit success events

			return { success: true, quest };
		} catch (error) {
			this.logger.error("Failed to start quest:", error);

			// Emit error event
			this.eventBus.emit(GameEvents.ERROR, {
				message: "Failed to start quest",
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
			this.eventBus.emit(GameEvents.LOADING_END, { source: "startQuest" });
		}
	}
}
