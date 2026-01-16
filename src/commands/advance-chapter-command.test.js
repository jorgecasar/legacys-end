import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdvanceChapterCommand } from "./advance-chapter-command.js";

describe("AdvanceChapterCommand", () => {
	/** @type {any} */
	let mockQuestLoader;
	/** @type {any} */
	let mockHeroState;

	beforeEach(() => {
		vi.useFakeTimers();
		mockHeroState = {
			setIsEvolving: vi.fn(),
		};
		mockQuestLoader = {
			context: {
				sessionService: {
					currentQuest: { get: vi.fn().mockReturnValue({ id: "test-quest" }) },
				},
				questController: {
					isLastChapter: vi.fn(),
				},
				heroState: mockHeroState,
			},
			completeChapter: vi.fn(),
			completeQuest: vi.fn(),
		};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should advance chapter with evolution state sequence", async () => {
		const command = new AdvanceChapterCommand({
			heroState: mockHeroState,
			questLoader: mockQuestLoader,
		});

		const executePromise = command.execute();

		// Check intermediate state (evolution should be active)
		expect(mockHeroState.setIsEvolving).toHaveBeenCalledWith(true);

		// Fast-forward time
		await vi.advanceTimersByTimeAsync(500);
		await executePromise;

		expect(mockQuestLoader.completeChapter).toHaveBeenCalled();
		expect(mockHeroState.setIsEvolving).toHaveBeenCalledWith(false);
	});

	describe("Regression Tests", () => {
		it("should complete quest if on last chapter (Fix: Unable to exit last chapter)", async () => {
			mockQuestLoader.context.questController.isLastChapter.mockReturnValue(
				true,
			);
			const command = new AdvanceChapterCommand({
				heroState: mockHeroState,
				questLoader: mockQuestLoader,
			});

			const executePromise = command.execute();
			await vi.advanceTimersByTimeAsync(500);
			await executePromise;

			expect(mockQuestLoader.completeQuest).toHaveBeenCalled();
			expect(mockQuestLoader.completeChapter).not.toHaveBeenCalled();
		});
	});
});
