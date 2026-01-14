import { GameEvents } from "../core/event-bus.js";

/**
 * CompleteQuestUseCase
 *
 * Business logic for completing the current quest.
 * Handles quest completion, progress updates, and event emission.
 */
export class CompleteQuestUseCase {
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
	 * @returns {{success: boolean, questId?: string, error?: Error}}
	 */
	execute() {
		try {
			// Get current quest before completing
			const currentQuest = this.questController.currentQuest;

			if (!currentQuest) {
				this.logger.warn("No active quest to complete");
				return { success: false, error: new Error("No active quest") };
			}

			const questId = currentQuest.id;
			this.logger.info(`🎉 Completing quest: ${questId}`);

			// The persistence part is handled here
			// Note: questController.completeQuest() previously did this.
			// We move it here to be the single source of truth for completion business logic.
			this.questController.progressService.completeQuest(questId);

			// Emit completion event
			this.eventBus.emit(GameEvents.QUEST_COMPLETE, {
				questId,
				quest: currentQuest,
			});

			return { success: true, questId };
		} catch (error) {
			this.logger.error("Failed to complete quest:", error);
			this.eventBus.emit(GameEvents.ERROR, {
				message: "Failed to complete quest",
				error,
			});
			return { success: false, error: /** @type {Error} */ (error) };
		}
	}
}
