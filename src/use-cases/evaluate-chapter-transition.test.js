import { describe, expect, it, vi } from "vitest";
import { evaluateChapterTransition } from "./evaluate-chapter-transition.js";

describe("evaluateChapterTransition", () => {
	it("should return failure if dependencies are missing", () => {
		const result = evaluateChapterTransition(/** @type {any} */ ({}));
		expect(result.isFailure).toBe(true);
		expect(result.error).toBe(
			"Missing dependencies for chapter transition evaluation.",
		);
	});

	it("should complete a chapter and do nothing else if it's not the last one", () => {
		const progressService = {
			isChapterCompleted: vi.fn().mockReturnValue(false),
			completeChapter: vi.fn(),
			isQuestCompleted: vi.fn().mockReturnValue(false),
			logger: console,
			getProperty: vi.fn().mockImplementation((key) => {
				if (key === "currentQuest") return "quest1";
				return null;
			}),
		};
		const questRegistry = {
			getQuest: vi
				.fn()
				.mockReturnValue({ id: "quest1", chapterIds: ["ch1", "ch2"] }),
		};

		const result = evaluateChapterTransition({
			progressService: /** @type {any} */ (progressService),
			questRegistry: /** @type {any} */ (questRegistry),
			chapterId: "ch1",
		});

		expect(result.isSuccess).toBe(true);
		expect(progressService.completeChapter).toHaveBeenCalledWith("ch1");
		expect(result.getValue().newlyUnlockedQuests).toEqual([]);
	});

	it("should complete the chapter and the quest if it is the last chapter", () => {
		const progressService = {
			isChapterCompleted: vi
				.fn()
				.mockImplementation((chapterId) => chapterId === "ch1-completed"),
			completeChapter: vi.fn().mockImplementation((chapterId) => {
				progressService.isChapterCompleted.mockImplementation(
					(id) => id === chapterId || id === "ch1-completed",
				);
			}),
			isQuestCompleted: vi.fn().mockReturnValue(false),
			completeQuest: vi.fn(),
			unlockQuest: vi.fn(),
			logger: console,
			getProperty: vi.fn().mockImplementation((key) => {
				if (key === "currentQuest") return "quest1";
				if (key === "completedQuests") return [];
				if (key === "unlockedQuests") return ["quest1"];
				return null;
			}),
		};
		const questRegistry = {
			getQuest: vi.fn().mockReturnValue({ id: "quest1", chapterIds: ["ch1"] }),
			getAllQuests: vi.fn().mockReturnValue([]),
			isQuestLocked: vi.fn().mockReturnValue(true),
		};

		const result = evaluateChapterTransition({
			progressService: /** @type {any} */ (progressService),
			questRegistry: /** @type {any} */ (questRegistry),
			chapterId: "ch1",
		});

		expect(result.isSuccess).toBe(true);
		expect(progressService.completeChapter).toHaveBeenCalledWith("ch1");
		expect(progressService.completeQuest).toHaveBeenCalledWith("quest1");
	});

	it("should unlock new quests when a quest is completed", () => {
		const progressService = {
			isChapterCompleted: vi.fn().mockReturnValue(true),
			completeChapter: vi.fn(),
			isQuestCompleted: vi.fn().mockReturnValue(false),
			completeQuest: vi.fn(),
			unlockQuest: vi.fn(),
			logger: console,
			getProperty: vi.fn().mockImplementation((key) => {
				if (key === "currentQuest") return "quest1";
				if (key === "completedQuests") return ["quest0"];
				if (key === "unlockedQuests") return ["quest0", "quest1"];
				return null;
			}),
		};
		const questRegistry = {
			getQuest: vi.fn().mockReturnValue({ id: "quest1", chapterIds: ["ch1"] }),
			getAllQuests: vi
				.fn()
				.mockReturnValue([{ id: "quest2", prerequisites: ["quest1"] }]),
			isQuestLocked: vi.fn().mockImplementation((questId, completed) => {
				return questId === "quest2" && !completed.includes("quest1");
			}),
		};

		// This is a bit tricky, after completeQuest is called, the internal state of completedQuests should change
		progressService.completeQuest.mockImplementation(() => {
			progressService.getProperty = vi.fn().mockImplementation((key) => {
				if (key === "currentQuest") return "quest1";
				if (key === "completedQuests") return ["quest0", "quest1"];
				if (key === "unlockedQuests") return ["quest0", "quest1"];
				return null;
			});
		});

		const result = evaluateChapterTransition({
			progressService: /** @type {any} */ (progressService),
			questRegistry: /** @type {any} */ (questRegistry),
			chapterId: "ch1",
		});

		expect(result.isSuccess).toBe(true);
		expect(progressService.completeQuest).toHaveBeenCalledWith("quest1");
		expect(progressService.unlockQuest).toHaveBeenCalledWith("quest2");
		expect(result.getValue().newlyUnlockedQuests).toEqual(["quest2"]);
	});
});
