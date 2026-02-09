import { Result } from "../utils/result.js";

/**
 * EvaluateChapterTransitionUseCase
 *
 * Determines the next step in quest progression based on current state.
 */
export class EvaluateChapterTransitionUseCase {
	/**
	 * @typedef {Object} TransitionResult
	 * @property {'ADVANCE' | 'COMPLETE' | 'NONE'} action
	 * @property {string} [nextChapterId]
	 * @property {number} [nextIndex]
	 */

	/**
	 * Execute the evaluation
	 * @param {Object} params
	 * @param {import('../services/quest-registry-service.js').Quest} [params.quest]
	 * @param {number} params.currentIndex - The current index of the chapter
	 * @returns {Result<TransitionResult, Error>}
	 */
	execute({ quest, currentIndex }) {
		if (!quest || !quest.chapterIds) {
			return /** @type {Result<TransitionResult, Error>} */ (
				/** @type {any} */ (
					Result.Err(new Error("Quest or quest chapter IDs are not provided."))
				)
			);
		}

		const nextIndex = currentIndex + 1;
		if (nextIndex < quest.chapterIds.length) {
			return /** @type {Result<TransitionResult, Error>} */ (
				/** @type {any} */ (
					Result.Ok({
						action: "ADVANCE",
						nextIndex,
						nextChapterId: quest.chapterIds[nextIndex] || "",
					})
				)
			);
		}

		return /** @type {Result<TransitionResult, Error>} */ (
			/** @type {any} */ (Result.Ok({ action: "COMPLETE" }))
		);
	}
}
