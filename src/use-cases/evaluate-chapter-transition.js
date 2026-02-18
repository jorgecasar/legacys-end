import { Result } from "../core/result.js";
import { unlockNewQuests } from "./unlock-new-quests.js";

/**
 * @typedef {import('../types/services.d.js').IProgressService} IProgressService
 * @typedef {import('../services/quest-registry-service.js').QuestRegistryService} QuestRegistryService
 */

/**
 * Evaluates the consequences of a chapter transition (e.g., completion).
 *
 * This use case orchestrates the logic for:
 * 1. Completing a chapter.
 * 2. Checking if the parent quest is now complete.
 * 3. If the quest is complete, it triggers quest completion logic (rewards, unlocks).
 *
 * @param {object} dependencies - The dependencies for this use case.
 * @param {IProgressService} dependencies.progressService - The service managing user progress.
 * @param {QuestRegistryService} dependencies.questRegistry - The service for quest data.
 * @param {string} dependencies.chapterId - The ID of the chapter that was just completed.
 * @returns {Result<{newlyUnlockedQuests: string[]}>} A result object indicating success or failure.
 */
export function evaluateChapterTransition({
	progressService,
	questRegistry,
	chapterId,
}) {
	if (!progressService || !questRegistry || !chapterId) {
		return Result.failure(
			"Missing dependencies for chapter transition evaluation.",
		);
	}

	try {
		// 1. Complete the chapter
		if (!progressService.isChapterCompleted(chapterId)) {
			progressService.completeChapter(chapterId); // This will save
		}

		// 2. Check if the parent quest is now complete
		const questId = progressService.getProperty("currentQuest");
		if (!questId) {
			// No active quest, so nothing more to do
			return Result.success({ newlyUnlockedQuests: [] });
		}

		const quest = questRegistry.getQuest(questId);
		if (!quest) {
			return Result.failure(`Quest not found for ID: ${questId}`);
		}

		const allChaptersDone = quest.chapterIds?.every((id) =>
			progressService.isChapterCompleted(id),
		);

		/** @type {string[]} */
		let newlyUnlockedQuests = [];
		// 3. If the quest is complete, trigger completion logic
		if (allChaptersDone && !progressService.isQuestCompleted(questId)) {
			progressService.completeQuest(questId); // This handles rewards and saves

			// 4. Unlock new quests
			const unlockResult = unlockNewQuests({ progressService, questRegistry });
			if (unlockResult.isFailure) {
				return Result.failure(unlockResult.error || "Failed to unlock quests.");
			}
			newlyUnlockedQuests = unlockResult.getValue();
		}

		return Result.success({ newlyUnlockedQuests });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		progressService.logger?.error(
			`Failed to evaluate chapter transition for ${chapterId}: ${errorMessage}`,
		);
		return Result.failure(errorMessage);
	}
}
