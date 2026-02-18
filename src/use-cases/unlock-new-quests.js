import { Result } from "../core/result.js";

/**
 * @typedef {import('../types/services.d.js').IProgressService} IProgressService
 * @typedef {import('../services/quest-registry-service.js').QuestRegistryService} QuestRegistryService
 */

/**
 * Unlocks new quests based on completed prerequisites.
 *
 * @param {object} dependencies - The dependencies for this use case.
 * @param {IProgressService} dependencies.progressService - The service managing user progress.
 * @param {QuestRegistryService} dependencies.questRegistry - The service for quest data.
 * @returns {Result<string[]>} A result object containing the IDs of any newly unlocked quests.
 */
export function unlockNewQuests({ progressService, questRegistry }) {
	if (!progressService || !questRegistry) {
		return Result.failure("Missing dependencies for unlocking new quests.");
	}

	try {
		const newlyUnlocked = [];
		const allQuests = questRegistry.getAllQuests();
		const completedQuests = progressService.getProperty("completedQuests");
		const unlockedQuests = progressService.getProperty("unlockedQuests");

		for (const quest of allQuests) {
			if (unlockedQuests.includes(quest.id)) {
				continue;
			}

			const isLocked = questRegistry.isQuestLocked(quest.id, completedQuests);

			if (!isLocked) {
				progressService.unlockQuest(quest.id); // This saves progress
				newlyUnlocked.push(quest.id);
				progressService.logger?.info(`🔓 New quest unlocked: ${quest.id}`);
			}
		}

		return Result.success(newlyUnlocked);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		progressService.logger?.error(
			`Failed to unlock new quests: ${errorMessage}`,
		);
		return Result.failure(errorMessage);
	}
}
