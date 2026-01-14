import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameEvents } from "../core/event-bus.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { QuestController } from "./quest-controller.js";

describe("QuestController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {QuestController} */
	let controller;
	/** @type {FakeProgressService} */
	let fakeProgressService;
	/** @type {any} */
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
			reward: { badge: "test-badge" }, // Added for completeness
		};

		// Reset Mocks
		vi.clearAllMocks();

		// Mock Registry - Needed for ProgressService
		mockRegistry = {
			getQuest: vi
				.fn()
				.mockImplementation((id) => (id === "test-quest" ? mockQuest : null)),
			loadQuestData: vi
				.fn()
				.mockImplementation(async (id) =>
					id === "test-quest" ? mockQuest : null,
				),
			getAvailableQuests: vi.fn().mockReturnValue([mockQuest]),
			getAllQuests: vi.fn().mockReturnValue([mockQuest]),
			isQuestLocked: vi.fn().mockReturnValue(false),
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

		// Use FakeProgressService
		fakeProgressService = new FakeProgressService(
			/** @type {any} */ (mockRegistry),
		);
		// Ensure quest is available in progress service (unlocked by default in fake usually, or we add it)
		fakeProgressService.progress.unlockedQuests = ["test-quest"];

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
			progressService: fakeProgressService,
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

			// Verify state in FakeProgressService
			expect(fakeProgressService.progress.currentQuest).toBe("test-quest");
			expect(fakeProgressService.progress.currentChapter).toBe("chapter-1");

			expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.QUEST_STARTED, {
				quest: mockQuest,
				started: true,
			});
			expect(mockEventBus.emit).toHaveBeenCalledWith(
				GameEvents.CHAPTER_CHANGED,
				{
					chapter: expect.objectContaining({ id: "chapter-1" }),
					index: 0,
				},
			);
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should not start a quest if it does not exist", async () => {
			await controller.startQuest("non-existent");

			expect(controller.currentQuest).toBeNull();
			expect(mockEventBus.emit).not.toHaveBeenCalled();
		});

		it("should not start a quest if it is not available", async () => {
			// Lock the quest in progress service
			fakeProgressService.progress.unlockedQuests = [];

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
			expect(controller.currentChapterIndex).toBe(0);

			controller.completeChapter();

			// Verify state in FakeProgressService
			expect(fakeProgressService.isChapterCompleted("chapter-1")).toBe(true);
			expect(fakeProgressService.progress.currentChapter).toBe("chapter-2");

			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter?.id).toBe("chapter-2");

			expect(mockEventBus.emit).toHaveBeenCalledWith(
				GameEvents.CHAPTER_CHANGED,
				{
					chapter: expect.objectContaining({ id: "chapter-2" }),
					index: 1,
				},
			);
		});

		it("should complete quest when finishing last chapter", () => {
			// Advance to last chapter manally
			controller.currentChapterIndex = 2;
			controller.currentChapter = /** @type {any} */ ({ id: "chapter-3" });

			controller.completeChapter();

			// Verify state
			expect(fakeProgressService.isChapterCompleted("chapter-3")).toBe(true);
			expect(fakeProgressService.isQuestCompleted("test-quest")).toBe(true);

			expect(mockEventBus.emit).toHaveBeenCalledWith(
				GameEvents.QUEST_COMPLETE,
				{
					quest: mockQuest,
				},
			);
		});
	});

	describe("resumeQuest", () => {
		it("should resume quest from progress service if no current quest", async () => {
			// Setup fake state
			fakeProgressService.progress.currentQuest = "test-quest";
			fakeProgressService.progress.currentChapter = "chapter-2"; // Optional, but let's say we were here

			await controller.resumeQuest();

			expect(mockRegistry.loadQuestData).toHaveBeenCalledWith("test-quest");
			expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.QUEST_STARTED, {
				quest: mockQuest,
				continued: true,
			});
		});

		it("should do nothing if no quest to resume", async () => {
			fakeProgressService.progress.currentQuest = null;

			await controller.resumeQuest();

			expect(controller.currentQuest).toBeNull();
		});
	});

	describe("continueQuest", () => {
		it("should continue from the first uncompleted chapter", async () => {
			// Mock that chapter 1 is completed in fake
			fakeProgressService.progress.completedChapters = ["chapter-1"];

			await controller.continueQuest("test-quest");

			expect(controller.currentQuest).toEqual(mockQuest);
			expect(controller.currentChapterIndex).toBe(1); // Should skip to chapter 2
			expect(controller.currentChapter?.id).toBe("chapter-2");
			expect(fakeProgressService.progress.currentChapter).toBe("chapter-2");
		});
	});

	describe("jumpToChapter", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
			vi.clearAllMocks();
		});

		it("should jump to valid chapter if accessible", () => {
			// Mark previous chapters as completed
			fakeProgressService.progress.completedChapters = ["chapter-1"];

			const result = controller.jumpToChapter("chapter-2");

			expect(result).toBe(true);
			expect(controller.currentChapterIndex).toBe(1);
			expect(controller.currentChapter?.id).toBe("chapter-2");
			expect(fakeProgressService.progress.currentChapter).toBe("chapter-2");
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
			fakeProgressService.progress.completedChapters = [];

			// Try to jump to Chapter 3
			const result = controller.jumpToChapter("chapter-3");

			expect(result).toBe(false);
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

			expect(fakeProgressService.progress.currentQuest).toBeNull();
			expect(fakeProgressService.progress.currentChapter).toBeNull();

			expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.RETURN_TO_HUB);
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

			// Should NOT reset progress (completed chapters should remain if any)
			// But verify it doesn't emit STARTED
			expect(mockEventBus.emit).not.toHaveBeenCalledWith(
				GameEvents.QUEST_STARTED,
				expect.anything(),
			);
		});

		it("should return false if quest does not exist", async () => {
			// Mock loader failure via registry mock
			mockRegistry.loadQuestData.mockResolvedValue(null);
			const result = await controller.loadQuest("non-existent");
			expect(result).toBe(false);
		});

		it("should return false if quest is not available", async () => {
			fakeProgressService.progress.unlockedQuests = [];
			const result = await controller.loadQuest("test-quest");
			expect(result).toBe(false);
		});
	});

	describe("Helper Methods and Getters", () => {
		beforeEach(async () => {
			await controller.startQuest("test-quest");
		});

		it("getQuestProgress should return progress from service", () => {
			// Set state in fake
			// Quest has 3 chapters. Complete 1 leads to 33% roughly?
			// Service calculation: round((completed / total) * 100)
			fakeProgressService.completeChapter("chapter-1");

			const progress = controller.getQuestProgress("test-quest");

			// 1/3 ~ 33
			expect(progress).toBe(33);
		});

		it("isQuestCompleted should check completion status", () => {
			fakeProgressService.completeQuest("test-quest");

			const isCompleted = controller.isQuestCompleted("test-quest");

			expect(isCompleted).toBe(true);
		});

		it("resetProgress should reset and return to hub", () => {
			controller.resetProgress();

			// Check fake was reset (it clears storage/memory)
			// FakeReset sets unlockedQuests to default ["the-aura-of-sovereignty"]
			// If our test-quest isn't that, it might be locked now, but state is reset.

			expect(controller.currentQuest).toBeNull();
			expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.RETURN_TO_HUB);
		});

		// ... (Other simple getters omitted or kept as simple unit tests)
		it("isInQuest should return true when in quest", () => {
			expect(controller.isInQuest()).toBe(true);
		});
	});
});
