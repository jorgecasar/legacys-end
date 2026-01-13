import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestController } from "./quest-controller.js";

// Mock dependencies
// Registry mock will be injected directly
// ProgressService mock remains as checking module mock for now,
// or should we inject mock instance?
// Controller constructor: options.progressService.
// The test currently mimics the module mock being the instance used?
// The controller previously did `new ProgressService()`.
// Now avoiding changing ProgressService logic too much in this step.

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

import { EVENTS } from "../constants/events.js";

describe("QuestController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/**
	 * @type {QuestController}
	 */
	let controller;
	/**
	 * @type {import("../services/quest-registry-service.js").Quest}
	 */
	let mockQuest;
	/** @type {any} */
	let mockEventBus;
	/** @type {any} */
	let mockRegistry;
	/** @type {any} */
	let mockLogger;

	beforeEach(async () => {
		// Mock Host
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		// Mock Quest Data
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			description: "Test Description",
			icon: "test-icon",
			difficulty: "beginner",
			chapterIds: ["chapter-1", "chapter-2", "chapter-3"],
			chapters: {
				"chapter-1": { id: "chapter-1", title: "Chapter 1" },
				"chapter-2": { id: "chapter-2", title: "Chapter 2" },
				"chapter-3": { id: "chapter-3", title: "Chapter 3" },
			},
		};

		// Reset Mocks
		vi.clearAllMocks();

		// Mock Registry
		mockRegistry = {
			getQuest: vi.fn().mockReturnValue(mockQuest),
			loadQuestData: vi.fn().mockResolvedValue(mockQuest),
			getAvailableQuests: vi.fn(),
		};

		// Mock EventBus
		mockEventBus = {
			emit: vi.fn(),
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
		};

		// Mock Logger
		mockLogger = {
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
		};

		// Create instances of the mocked services
		const MockProgressService = /** @type {any} */ (
			(await import("../services/progress-service.js")).ProgressService
		);
		const progressService = new MockProgressService();
		// controller.progressService = progressService; // Removed buggy assignment before init

		const mockEvaluateChapterTransition = {
			execute: vi.fn().mockImplementation(({ quest, currentIndex }) => {
				const isLast = currentIndex === (quest.chapterIds?.length || 0) - 1;
				return { action: isLast ? "COMPLETE" : "ADVANCE" };
			}),
		};

		controller = new QuestController(host, {
			eventBus: mockEventBus,
			registry: /** @type {any} */ (mockRegistry),
			logger: /** @type {any} */ (mockLogger),
			progressService: progressService,
			evaluateChapterTransition: /** @type {any} */ (
				mockEvaluateChapterTransition
			),
		});
	});

	it("should initialize and add itself to host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("startQuest", () => {
		it("should start a quest successfully", async () => {
			await controller.startQuest("test-quest");

			expect(mockRegistry.loadQuestData).toHaveBeenCalledWith("test-quest");
			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.currentChapterIndex).toBe(0);
			expect(controller.currentChapter?.id).toBe("chapter-1");
			expect(
				controller.progressService.resetQuestProgress,
			).toHaveBeenCalledWith("test-quest");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				"chapter-1",
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.QUEST.STARTED, {
				quest: mockQuest,
				started: true,
			});
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				EVENTS.QUEST.CHAPTER_CHANGED,
				{
					chapter: expect.objectContaining({ id: "chapter-1" }),
					index: 0,
				},
			);
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should not start a quest if it does not exist", async () => {
			mockRegistry.loadQuestData.mockResolvedValue(/** @type {any} */ (null));

			await controller.startQuest("non-existent");

			expect(controller.currentQuest).toBeNull();
			expect(mockEventBus.emit).not.toHaveBeenCalled();
		});

		it("should not start a quest if it is not available", async () => {
			/** @type {import("vitest").Mock} */ (
				controller.progressService.isQuestAvailable
			).mockReturnValue(false);

			await controller.startQuest("test-quest");

			expect(controller.currentQuest).toBeNull();
			expect(mockEventBus.emit).not.toHaveBeenCalled();
		});
	});

	describe("Chapter Progression", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks(); // Clear mocks called during startQuest
		});

		it("should complete current chapter and advance to next", () => {
			// Initial state
			expect(controller.currentChapterIndex).toBe(0);

			controller.completeChapter();

			// Should mark chapter as completed
			expect(controller.progressService.completeChapter).toHaveBeenCalledWith(
				"chapter-1",
			);

			// Should advance to next chapter
			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter?.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				"chapter-2",
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				EVENTS.QUEST.CHAPTER_CHANGED,
				{
					chapter: expect.objectContaining({ id: "chapter-2" }),
					index: 1,
				},
			);
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should complete quest when finishing last chapter", () => {
			// Advance to last chapter (index 2 because mockQuest has 3 chapters)
			controller.currentChapterIndex = 2;
			controller.currentChapter =
				/** @type {import("../content/quests/quest-types.js").LevelConfig} */ (
					/** @type {unknown} */ ({ id: "chapter-3" })
				);

			controller.completeChapter();

			expect(controller.progressService.completeChapter).toHaveBeenCalledWith(
				"chapter-3",
			);
			expect(controller.progressService.completeQuest).toHaveBeenCalledWith(
				"test-quest",
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.QUEST.COMPLETED, {
				quest: mockQuest,
			});
		});
	});

	describe("resumeQuest", () => {
		it("should resume quest from progress service if no current quest", async () => {
			// Setup progress service to return a saved quest
			/** @type {import("vitest").Mock} */ (
				controller.progressService.getProgress
			).mockReturnValue({
				currentQuest: "test-quest",
			});

			await controller.resumeQuest();

			expect(controller.progressService.getProgress).toHaveBeenCalled();
			expect(mockRegistry.loadQuestData).toHaveBeenCalledWith("test-quest");
			expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.QUEST.STARTED, {
				quest: mockQuest,
				continued: true,
			});
		});

		it("should do nothing if no quest to resume", async () => {
			/** @type {import("vitest").Mock} */ (
				controller.progressService.getProgress
			).mockReturnValue({}); // No current quest

			await controller.resumeQuest();

			expect(controller.currentQuest).toBeNull();
		});
	});

	describe("continueQuest", () => {
		it("should continue from the first uncompleted chapter", async () => {
			// Mock that chapter 1 is completed
			/** @type {import("vitest").Mock} */ (
				controller.progressService.isChapterCompleted
			).mockImplementation((/** @type {unknown} */ id) => id === "chapter-1");

			await controller.continueQuest("test-quest");

			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.currentChapterIndex).toBe(1); // Should skip to chapter 2
			expect(controller.currentChapter?.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				"chapter-2",
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.QUEST.STARTED, {
				quest: mockQuest,
				continued: true,
			});
		});
	});

	describe("jumpToChapter", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks();
		});

		it("should jump to valid chapter if accessible", () => {
			// Mock previous chapters as completed
			/** @type {import("vitest").Mock} */ (
				controller.progressService.isChapterCompleted
			).mockImplementation((/** @type {unknown} */ id) => id === "chapter-1");

			const result = controller.jumpToChapter("chapter-2");

			expect(result).toBe(true);
			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter?.id).toBe("chapter-2");
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				"test-quest",
				"chapter-2",
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
			/** @type {import("vitest").Mock} */ (
				controller.progressService.isChapterCompleted
			).mockReturnValue(false);

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
			controller.returnToHub();

			expect(controller.currentQuest).toBeNull();
			expect(controller.currentChapter).toBeNull();
			expect(controller.currentChapterIndex).toBe(0);
			expect(controller.progressService.setCurrentQuest).toHaveBeenCalledWith(
				null,
				null,
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				EVENTS.QUEST.RETURN_TO_HUB,
			);
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
			expect(chapterData?.id).toBe("chapter-1");
			expect(/** @type {any} */ (chapterData)?.questId).toBe("test-quest");
			expect(/** @type {any} */ (chapterData)?.index).toBe(0);
			expect(/** @type {any} */ (chapterData)?.total).toBe(3);
			expect(/** @type {any} */ (chapterData)?.isQuestComplete).toBe(false);
		});

		it("should return null if no current quest", () => {
			controller.currentQuest = null;
			const chapterData = controller.getCurrentChapterData();
			expect(chapterData).toBeNull();
		});

		it("should indicate when on last chapter", () => {
			controller.currentChapterIndex = 2; // Last chapter
			const chapterData = controller.getCurrentChapterData();
			expect(/** @type {any} */ (chapterData)?.isQuestComplete).toBe(true);
		});
	});

	describe("loadQuest", () => {
		it("should load quest without resetting progress", async () => {
			const result = await controller.loadQuest("test-quest");

			expect(result).toBe(true);
			expect(controller.currentQuest).toEqual(mockQuest);
			expect(
				controller.progressService.resetQuestProgress,
			).not.toHaveBeenCalled();
			// loadQuest does NOT emit STARTED, it signals loaded=true to other components if they listen differently
			// or it relies on chapter change. But existing code emits CHAPTER_CHANGED.
			// Let's verify that NO STARTED event is emitted.
			expect(mockEventBus.emit).not.toHaveBeenCalledWith(
				EVENTS.QUEST.STARTED,
				expect.anything(),
			);
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				EVENTS.QUEST.CHAPTER_CHANGED,
				expect.anything(),
			);
		});

		it("should return false if quest does not exist", async () => {
			mockRegistry.loadQuestData.mockResolvedValue(/** @type {any} */ (null));
			const result = await controller.loadQuest("non-existent");
			expect(result).toBe(false);
		});

		it("should return false if quest is not available", async () => {
			/** @type {any} */ (
				controller.progressService.isQuestAvailable
			).mockReturnValue(false);
			const result = await controller.loadQuest("test-quest");
			expect(result).toBe(false);
		});
	});

	describe("Helper Methods and Getters", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
		});

		it("getAvailableQuests should return quests from registry", () => {
			const mockAvailableQuests = /** @type {any} */ ([
				{ id: "quest-1", name: "Quest 1" },
				{ id: "quest-2", name: "Quest 2" },
			]);
			mockRegistry.getAvailableQuests.mockReturnValue(mockAvailableQuests);

			const quests = controller.getAvailableQuests();

			expect(quests).toEqual(mockAvailableQuests);
			expect(mockRegistry.getAvailableQuests).toHaveBeenCalled();
		});

		it("getQuestProgress should return progress from service", () => {
			/** @type {any} */ (
				controller.progressService.getQuestProgress
			).mockReturnValue(75);

			const progress = controller.getQuestProgress("test-quest");

			expect(progress).toBe(75);
			expect(controller.progressService.getQuestProgress).toHaveBeenCalledWith(
				"test-quest",
			);
		});

		it("isQuestCompleted should check completion status", () => {
			/** @type {any} */ (
				controller.progressService.isQuestCompleted
			).mockReturnValue(true);

			const isCompleted = controller.isQuestCompleted("test-quest");

			expect(isCompleted).toBe(true);
			expect(controller.progressService.isQuestCompleted).toHaveBeenCalledWith(
				"test-quest",
			);
		});

		it("getOverallProgress should return overall progress", () => {
			/** @type {any} */ (
				controller.progressService.getOverallProgress
			).mockReturnValue(50);

			const progress = controller.getOverallProgress();

			expect(progress).toBe(50);
		});

		it("resetProgress should reset and return to hub", () => {
			controller.resetProgress();

			expect(controller.progressService.resetProgress).toHaveBeenCalled();
			expect(controller.currentQuest).toBeNull();
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				EVENTS.QUEST.RETURN_TO_HUB,
			);
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
			controller.currentChapter = /** @type {any} */ ({
				id: "chapter-1",
				exitZone: /** @type {any} */ ({ x: 10, y: 10 }),
			});
			expect(controller.hasExitZone()).toBe(true);
		});

		it("hasExitZone should return false if no exitZone", () => {
			controller.currentChapter = /** @type {any} */ ({ id: "chapter-1" });
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
			expect(/** @type {any} */ (nextChapter).id).toBe("chapter-2");
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

	describe("jumpToChapter Validation", () => {
		it("should fail to jump if no active quest", () => {
			controller.currentQuest = null;
			const result = controller.jumpToChapter("chapter-2");
			expect(result).toBe(false);
		});

		it("should fail to jump if chapter does not exist", () => {
			controller.currentQuest = mockQuest;
			const result = controller.jumpToChapter("non-existent-chapter");
			expect(result).toBe(false);
		});

		it("should fail to jump if previous chapters are not completed", () => {
			controller.currentQuest = mockQuest;
			// Mock: chapter-1 is NOT completed
			vi.mocked(controller.progressService.isChapterCompleted).mockReturnValue(
				false,
			);

			// Try to jump to chapter-3 (index 2)
			const result = controller.jumpToChapter("chapter-3");

			expect(result).toBe(false);
			expect(
				controller.progressService.isChapterCompleted,
			).toHaveBeenCalledWith("chapter-1");
		});

		it("should succeed jumping if previous chapters are completed", () => {
			controller.currentQuest = mockQuest;
			// Mock: chapters are completed
			vi.mocked(controller.progressService.isChapterCompleted).mockReturnValue(
				true,
			);

			const result = controller.jumpToChapter("chapter-3");

			expect(result).toBe(true);
			expect(controller.currentChapterIndex).toBe(2);
			expect(controller.currentChapter?.id).toBe("chapter-3");
		});
	});

	describe("Data Retrieval Edge Cases", () => {
		it("should return null data if no current quest", () => {
			controller.currentQuest = null;
			expect(controller.getCurrentChapterData()).toBeNull();
		});

		it("should return null data if chapter ID is undefined", () => {
			controller.currentQuest = { ...mockQuest, chapterIds: [] };
			controller.currentChapterIndex = 0;
			expect(controller.getCurrentChapterData()).toBeNull();
		});

		it("should return fallback data if chapter definition is missing", () => {
			controller.currentQuest = {
				...mockQuest,
				chapters: {}, // Empty chapters
			};
			controller.currentChapterIndex = 0; // points to "chapter-1" in IDs

			const data = controller.getCurrentChapterData();

			expect(data).toHaveProperty("id", "chapter-1");
		});

		it("should not advance if already at last chapter", () => {
			controller.currentQuest = mockQuest;
			controller.currentChapterIndex = 2; // Last one

			const emitSpy = vi.spyOn(controller.eventBus, "emit");
			controller.nextChapter();

			expect(controller.currentChapterIndex).toBe(2);
			expect(emitSpy).not.toHaveBeenCalledWith(
				EVENTS.QUEST.CHAPTER_CHANGED,
				expect.any(Object),
			);
		});
	});
});
