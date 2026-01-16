/**
 * AdvanceChapterCommand
 *
 * Handles the transition to the next chapter.
 * Includes animation state management and quest completion logic.
 */
export class AdvanceChapterCommand {
	/**
	 * @param {Object} params
	 * @param {import('../game/interfaces.js').IHeroStateService} params.heroState
	 * @param {import('../services/quest-loader-service.js').QuestLoaderService} params.questLoader
	 */
	constructor({ heroState, questLoader }) {
		this.heroState = heroState;
		this.questLoader = questLoader;
		this.name = "AdvanceChapter";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const quest = this.questLoader.context.sessionService.currentQuest.get();
		if (quest) {
			this.heroState.setIsEvolving(true);

			// Simulate evolution animation duration
			await new Promise((resolve) => setTimeout(resolve, 500));

			const questController = this.questLoader.context.questController;
			if (questController.isLastChapter()) {
				await this.questLoader.completeQuest();
			} else {
				this.questLoader.completeChapter();
			}
			+this.heroState.setIsEvolving(false);
		}
	}
}
