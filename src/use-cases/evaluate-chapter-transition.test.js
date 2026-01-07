import { describe, expect, it } from "vitest";
import { EvaluateChapterTransitionUseCase } from "./evaluate-chapter-transition.js";

describe("EvaluateChapterTransitionUseCase", () => {
	const useCase = new EvaluateChapterTransitionUseCase();

	it("should return NONE if quest is invalid", () => {
		const result = useCase.execute({
			quest: /** @type {any} */ (null),
			currentIndex: 0,
		});
		expect(result).toEqual({ action: "NONE" });
	});

	it("should return ADVANCE if there is a next chapter", () => {
		const quest = /** @type {any} */ ({ chapterIds: ["1", "2", "3"] });
		const result = useCase.execute({ quest, currentIndex: 0 });
		expect(result).toEqual({
			action: "ADVANCE",
			nextIndex: 1,
			nextChapterId: "2",
		});
	});

	it("should return COMPLETE if it is the last chapter", () => {
		const quest = /** @type {any} */ ({ chapterIds: ["1", "2"] });
		const result = useCase.execute({ quest, currentIndex: 1 });
		expect(result).toEqual({ action: "COMPLETE" });
	});
});
