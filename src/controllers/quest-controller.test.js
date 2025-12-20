import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestController } from "./quest-controller.js";

// Mock dependencies
vi.mock("../quests/quest-registry.js", () => ({
	getQuest: vi.fn(),
	getAvailableQuests: vi.fn(),
}));

vi.mock("../services/progress-service.js", () => {
	return {
		ProgressService: class {
			getProgress = vi.fn().mockReturnValue({});
			isQuestAvailable = vi.fn().mockReturnValue(true);
			resetQuestProgress = vi.fn();
			setCurrentQuest = vi.fn();
			completeChapter = vi.fn();
			completeQuest = vi.fn();
			isChapterCompleted = vi.fn().mockReturnValue(false);
			getQuestProgress = vi.fn().mockReturnValue(0);
			isQuestCompleted = vi.fn().mockReturnValue(false);
			getOverallProgress = vi.fn().mockReturnValue(0);
			resetProgress = vi.fn();
			updateChapterState = vi.fn();
		},
	};
});

import { getQuest } from "../quests/quest-registry.js";

describe("QuestController", () => {
	let host;
	let controller;
	let mockQuest;

	beforeEach(() => {
		// Mock Host
		host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
		};

		// Mock Quest Data
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapterIds: ["chapter-1", "chapter-2", "chapter-3"],
			chapters: {
				"chapter-1": { id: "chapter-1", title: "Chapter 1" },
				"chapter-2": { id: "chapter-2", title: "Chapter 2" },
				"chapter-3": { id: "chapter-3", title: "Chapter 3" },
			},
		};

		// Reset Mocks
		vi.clearAllMocks();
		getQuest.mockReturnValue(mockQuest);

		controller = new QuestController(host);
	});

	it("should initialize and add itself to host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("startQuest", () => {
		it("should start a quest successfully", async () => {
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;
			const onChapterChange = vi.fn();
			controller.options.onChapterChange = onChapterChange;

			await controller.startQuest("test-quest");

			expect(getQuest).toHaveBeenCalledWith("test-quest");
			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.currentChapterIndex).toBe(0);
			expect(controller.currentChapter.id).toBe("chapter-1");
			expect(
				controller.progressService.resetQuestProgress,
			).toHaveBeenCalledWith("test-quest");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				0,
			);
			expect(onQuestStart).toHaveBeenCalledWith(mockQuest);
			expect(onChapterChange).toHaveBeenCalled();
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should not start a quest if it does not exist", async () => {
			getQuest.mockReturnValue(null);
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;

			await controller.startQuest("non-existent");

			expect(controller.currentQuest).toBeNull();
			expect(onQuestStart).not.toHaveBeenCalled();
		});

		it("should not start a quest if it is not available", async () => {
			controller.progressService.isQuestAvailable.mockReturnValue(false);
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;

			await controller.startQuest("test-quest");

			expect(controller.currentQuest).toBeNull();
			expect(onQuestStart).not.toHaveBeenCalled();
		});
	});

	describe("Chapter Progression", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks(); // Clear mocks called during startQuest
		});

		it("should complete current chapter and advance to next", () => {
			const onChapterChange = vi.fn();
			controller.options.onChapterChange = onChapterChange;

			// Initial state
			expect(controller.currentChapterIndex).toBe(0);

			controller.completeChapter();

			// Should mark chapter as completed
			expect(controller.progressService.completeChapter).toHaveBeenCalledWith(
				"chapter-1",
			);

			// Should advance to next chapter
			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				1,
			);
			expect(onChapterChange).toHaveBeenCalled();
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should complete quest when finishing last chapter", () => {
			const onQuestComplete = vi.fn();
			controller.options.onQuestComplete = onQuestComplete;

			// Advance to last chapter (index 2 because mockQuest has 3 chapters)
			controller.currentChapterIndex = 2;
			controller.currentChapter = { id: "chapter-3" };

			controller.completeChapter();

			expect(controller.progressService.completeChapter).toHaveBeenCalledWith(
				"chapter-3",
			);
			expect(controller.progressService.completeQuest).toHaveBeenCalledWith(
				"test-quest",
			);
			expect(onQuestComplete).toHaveBeenCalledWith(mockQuest);
		});
	});

	describe("resumeQuest", () => {
		it("should resume quest from progress service if no current quest", async () => {
			// Setup progress service to return a saved quest
			controller.progressService.getProgress.mockReturnValue({
				currentQuest: "test-quest",
			});
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;

			await controller.resumeQuest();

			expect(controller.progressService.getProgress).toHaveBeenCalled();
			expect(getQuest).toHaveBeenCalledWith("test-quest");
			expect(onQuestStart).toHaveBeenCalledWith(mockQuest);
		});

		it("should do nothing if no quest to resume", async () => {
			controller.progressService.getProgress.mockReturnValue({}); // No current quest

			await controller.resumeQuest();

			expect(controller.currentQuest).toBeNull();
		});
	});

	describe("continueQuest", () => {
		it("should continue from the first uncompleted chapter", async () => {
			// Mock that chapter 1 is completed
			controller.progressService.isChapterCompleted.mockImplementation(
				(id) => id === "chapter-1",
			);
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;

			await controller.continueQuest("test-quest");

			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.currentChapterIndex).toBe(1); // Should skip to chapter 2
			expect(controller.currentChapter.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				1,
			);
			expect(onQuestStart).toHaveBeenCalled();
		});
	});

	describe("jumpToChapter", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks();
		});

		it("should jump to valid chapter if accessible", () => {
			// Mock previous chapters as completed
			controller.progressService.isChapterCompleted.mockImplementation(
				(id) => id === "chapter-1",
			);

			const result = controller.jumpToChapter("chapter-2");

			expect(result).toBe(true);
			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				1,
			);
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should fail to jump if no active quest", () => {
			controller.currentQuest = null;
			const result = controller.jumpToChapter("chapter-1");
			expect(result).toBe(false);
		});

		it("should fail to jump if chapter does not exist", () => {
			const result = controller.jumpToChapter("non-existent");
			expect(result).toBe(false);
		});

		it("should fail to jump if previous chapters are not completed (sequential check)", () => {
			// Chapter 1 is NOT completed
			controller.progressService.isChapterCompleted.mockReturnValue(false);

			// Try to jump to Chapter 3
			const result = controller.jumpToChapter("chapter-3");

			expect(result).toBe(false);
			// Should stay on current chapter (initial 0)
			expect(controller.currentChapterIndex).toBe(0);
		});

		it("should allow jumping to Chapter 1 from Chapter 1 (re-enter)", () => {
			const result = controller.jumpToChapter("chapter-1");
			expect(result).toBe(true);
		});
	});

	describe("returnToHub", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks();
		});

		it("should clear quest state and return to hub", () => {
			const onReturnToHub = vi.fn();
			controller.options.onReturnToHub = onReturnToHub;

			controller.returnToHub();

			expect(controller.currentQuest).toBeNull();
			expect(controller.currentChapter).toBeNull();
			expect(controller.currentChapterIndex).toBe(0);
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				null,
				null,
			);
			expect(onReturnToHub).toHaveBeenCalled();
			expect(host.requestUpdate).toHaveBeenCalled();
		});
	});

	describe("getCurrentChapterData", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
		});

		it("should return enriched chapter data", () => {
			const chapterData = controller.getCurrentChapterData();

			expect(chapterData).toBeDefined();
			expect(chapterData.id).toBe("chapter-1");
			expect(chapterData.questId).toBe("test-quest");
			expect(chapterData.index).toBe(0);
			expect(chapterData.total).toBe(3);
			expect(chapterData.isQuestComplete).toBe(false);
		});

		it("should return null if no current quest", () => {
			controller.currentQuest = null;
			const chapterData = controller.getCurrentChapterData();
			expect(chapterData).toBeNull();
		});

		it("should indicate when on last chapter", () => {
			controller.currentChapterIndex = 2; // Last chapter
			const chapterData = controller.getCurrentChapterData();
			expect(chapterData.isQuestComplete).toBe(true);
		});
	});

	describe("loadQuest", () => {
		it("should load quest without resetting progress", async () => {
			const onQuestStart = vi.fn();
			controller.options.onQuestStart = onQuestStart;

			const result = await controller.loadQuest("test-quest");

			expect(result).toBe(true);
			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.progressService.resetQuestProgress).not.toHaveBeenCalled();
			expect(onQuestStart).toHaveBeenCalledWith(mockQuest);
		});

		it("should return false if quest does not exist", async () => {
			getQuest.mockReturnValue(null);
			const result = await controller.loadQuest("non-existent");
			expect(result).toBe(false);
		});

		it("should return false if quest is not available", async () => {
			controller.progressService.isQuestAvailable.mockReturnValue(false);
			const result = await controller.loadQuest("test-quest");
			expect(result).toBe(false);
		});
	});

	describe("Helper Methods and Getters", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
		});

		it("getAvailableQuests should return quests from registry", () => {
			const mockAvailableQuests = [
				{ id: "quest-1", name: "Quest 1" },
				{ id: "quest-2", name: "Quest 2" },
			];
			vi.spyOn(controller.registry, "getAvailableQuests").mockReturnValue(
				mockAvailableQuests,
			);

			const quests = controller.getAvailableQuests();

			expect(quests).toEqual(mockAvailableQuests);
			expect(controller.registry.getAvailableQuests).toHaveBeenCalled();
		});

		it("getQuestProgress should return progress from service", () => {
			controller.progressService.getQuestProgress.mockReturnValue(75);

			const progress = controller.getQuestProgress("test-quest");

			expect(progress).toBe(75);
			expect(controller.progressService.getQuestProgress).toHaveBeenCalledWith(
				"test-quest",
			);
		});

		it("isQuestCompleted should check completion status", () => {
			controller.progressService.isQuestCompleted.mockReturnValue(true);

			const isCompleted = controller.isQuestCompleted("test-quest");

			expect(isCompleted).toBe(true);
			expect(controller.progressService.isQuestCompleted).toHaveBeenCalledWith(
				"test-quest",
			);
		});

		it("getOverallProgress should return overall progress", () => {
			controller.progressService.getOverallProgress.mockReturnValue(50);

			const progress = controller.getOverallProgress();

			expect(progress).toBe(50);
		});

		it("resetProgress should reset and return to hub", () => {
			const onReturnToHub = vi.fn();
			controller.options.onReturnToHub = onReturnToHub;

			controller.resetProgress();

			expect(controller.progressService.resetProgress).toHaveBeenCalled();
			expect(controller.currentQuest).toBeNull();
			expect(onReturnToHub).toHaveBeenCalled();
		});

		it("isInQuest should return true when in quest", () => {
			expect(controller.isInQuest()).toBe(true);
		});

		it("isInHub should return false when in quest", () => {
			expect(controller.isInHub()).toBe(false);
		});

		it("isInHub should return true when not in quest", () => {
			controller.currentQuest = null;
			expect(controller.isInHub()).toBe(true);
		});

		it("isLastChapter should return false for first chapter", () => {
			expect(controller.isLastChapter()).toBe(false);
		});

		it("isLastChapter should return true for last chapter", () => {
			controller.currentChapterIndex = 2; // Last chapter (0-indexed)
			expect(controller.isLastChapter()).toBe(true);
		});

		it("hasExitZone should return true if chapter has exitZone", () => {
			controller.currentChapter = { id: "chapter-1", exitZone: { x: 10, y: 10 } };
			expect(controller.hasExitZone()).toBe(true);
		});

		it("hasExitZone should return false if no exitZone", () => {
			controller.currentChapter = { id: "chapter-1" };
			expect(controller.hasExitZone()).toBe(false);
		});

		it("getCurrentChapterNumber should return 1-indexed chapter number", () => {
			expect(controller.getCurrentChapterNumber()).toBe(1);
			controller.currentChapterIndex = 2;
			expect(controller.getCurrentChapterNumber()).toBe(3);
		});

		it("getTotalChapters should return total chapter count", () => {
			expect(controller.getTotalChapters()).toBe(3);
		});

		it("isCurrentChapter should check if chapter matches", () => {
			expect(controller.isCurrentChapter("chapter-1")).toBe(true);
			expect(controller.isCurrentChapter("chapter-2")).toBe(false);
		});

		it("getLastChapterId should return last chapter ID", () => {
			expect(controller.getLastChapterId()).toBe("chapter-3");
		});

		it("getNextChapterData should return next chapter data", () => {
			const nextChapter = controller.getNextChapterData();
			expect(nextChapter).toBeDefined();
			expect(nextChapter.id).toBe("chapter-2");
		});

		it("getNextChapterData should return null if on last chapter", () => {
			controller.currentChapterIndex = 2;
			const nextChapter = controller.getNextChapterData();
			expect(nextChapter).toBeNull();
		});

		it("hasNextChapter should return true if not on last chapter", () => {
			expect(controller.hasNextChapter()).toBe(true);
		});

		it("hasNextChapter should return false if on last chapter", () => {
			controller.currentChapterIndex = 2;
			expect(controller.hasNextChapter()).toBe(false);
		});
	});
});


