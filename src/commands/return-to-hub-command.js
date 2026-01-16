/**
 * ReturnToHubCommand
 *
 * Command wrapper for ReturnToHubUseCase.
 * Provides command interface for returning to the quest hub.
 */
export class ReturnToHubCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/quest-loader-service.js').QuestLoaderService} params.questLoader
	 */
	constructor({ questLoader }) {
		this.questLoader = questLoader;
		this.name = "ReturnToHub";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	async execute() {
		const result = /** @type {{success: boolean, error?: Error}} */ (
			await this.questLoader.returnToHub()
		);
		if (!result.success) {
			throw result.error || new Error("Failed to return to hub");
		}
		return result;
	}

	// Note: Return to hub typically doesn't support undo
}
