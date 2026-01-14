/**
 * AdvanceChapterCommand
 *
 * Handles the transition to the next chapter.
 * Includes animation state management and quest completion logic.
 */
export class AdvanceChapterCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/game-state-service.js').GameStateService} params.gameState
	 * @param {import('../managers/game-session-manager.js').GameSessionManager} params.sessionManager
	 */
	constructor({ gameState, sessionManager }) {
		this.gameState = gameState;
		this.sessionManager = sessionManager;
		this.name = "AdvanceChapter";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const quest = this.sessionManager.currentQuest.get();
		if (quest) {
			this.gameState.setEvolving(true);

			// Simulate evolution animation duration
			await new Promise((resolve) => setTimeout(resolve, 500));

			const questController = this.sessionManager.questController;
			if (questController.isLastChapter()) {
				await this.sessionManager.completeQuest();
			} else {
				this.sessionManager.completeChapter();
			}

			this.gameState.setEvolving(false);
		}
	}
}
