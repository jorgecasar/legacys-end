import { DomainError, Result } from "../core/errors.js";

/**
 * @typedef {Object} TransitionResult
 * @property {'ADVANCE' | 'COMPLETE' | 'NONE'} action
 * @property {string} [nextChapterId]
 * @property {number} [nextIndex]
 */

/**
 * EvaluateChapterTransitionUseCase
 *
 * Determines the next step in quest progression based on current state.
 */
export class EvaluateChapterTransitionUseCase {
	/**
	 * Execute the evaluation
	 * @param {Object} params
	 * @param {import('../services/quest-registry-service.js').Quest} [params.quest]
	 * @param {number} params.currentIndex
	 * @returns {Result<TransitionResult, DomainError>}
	 */
	execute({ quest, currentIndex }) {
		if (!quest || !quest.chapterIds) {
			return Result.failure(
				new DomainError("Invalid quest or missing chapters", "INVALID_QUEST"),
			);
		}

		const nextIndex = currentIndex + 1;
		if (nextIndex < quest.chapterIds.length) {
			return Result.success({
				action: "ADVANCE",
				nextIndex,
				nextChapterId: quest.chapterIds[nextIndex] || "",
			});
		}

		return Result.success({ action: "COMPLETE" });
	}
}
