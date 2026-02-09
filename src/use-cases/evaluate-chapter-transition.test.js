import { describe, expect, it } from "vitest";
import { EvaluateChapterTransitionUseCase } from "./evaluate-chapter-transition.js";

describe("EvaluateChapterTransitionUseCase", () => {
	const useCase = new EvaluateChapterTransitionUseCase();

	it("should return failure if quest is invalid", () => {
		const result = useCase.execute({
			quest: /** @type {any} */ (null),
			currentIndex: 0,
		});
		expect(result.isFailure).toBe(true);
		expect(
			/** @type {import('../core/errors.js').DomainError} */ (result.error)
				.code,
		).toBe("INVALID_QUEST");
	});

	it("should return ADVANCE if there is a next chapter", () => {
		const quest = /** @type {any} */ ({ chapterIds: ["1", "2", "3"] });
		const result = useCase.execute({ quest, currentIndex: 0 });
		expect(result.isSuccess).toBe(true);
		expect(result.value).toEqual({
			action: "ADVANCE",
			nextIndex: 1,
			nextChapterId: "2",
		});
	});

	it("should return COMPLETE if it is the last chapter", () => {
		const quest = /** @type {any} */ ({ chapterIds: ["1", "2"] });
		const result = useCase.execute({ quest, currentIndex: 1 });
		expect(result.isSuccess).toBe(true);
		expect(result.value).toEqual({ action: "COMPLETE" });
	});
});
