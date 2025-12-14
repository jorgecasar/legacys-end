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
			chapterIds: ["chapter-1", "chapter-2"],
			chapters: {
				"chapter-1": { id: "chapter-1", title: "Chapter 1" },
				"chapter-2": { id: "chapter-2", title: "Chapter 2" },
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

			// Advance to last chapter
			controller.nextChapter();
			expect(controller.currentChapterIndex).toBe(1); // Last chapter
			vi.clearAllMocks();

			controller.completeChapter();

			expect(controller.progressService.completeChapter).toHaveBeenCalledWith(
				"chapter-2",
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
});
