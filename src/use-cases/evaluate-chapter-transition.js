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
	 * @param {number} params.currentIndex
	 * @returns {TransitionResult}
	 */
	execute({ quest, currentIndex }) {
		if (!quest || !quest.chapterIds) {
			return { action: "NONE" };
		}

		const nextIndex = currentIndex + 1;
		if (nextIndex < quest.chapterIds.length) {
			return {
				action: "ADVANCE",
				nextIndex,
				nextChapterId: quest.chapterIds[nextIndex],
			};
		}

		return { action: "COMPLETE" };
	}
}
