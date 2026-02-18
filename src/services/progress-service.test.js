import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressService } from "./progress-service.js";

// Mock Storage
const mockStorage = {
	items: /** @type {Record<string, any>} */ ({}),
	getItem: vi.fn((key) => mockStorage.items[key]),
	setItem: vi.fn((key, value) => {
		mockStorage.items[key] = value;
	}),
	removeItem: vi.fn((key) => {
		delete mockStorage.items[key];
	}),
	clear: vi.fn(() => {
		mockStorage.items = {};
	}),
};

// Mock Registry
/** @type {any} */
const mockRegistry = {
	getQuest: vi.fn(),
	getAllQuests: vi.fn(),
	isQuestLocked: vi.fn(),
	getAvailableQuests: vi.fn(),
	getComingSoonQuests: vi.fn(),
};

describe("ProgressService", () => {
	/** @type {ProgressService} */
	let service;

	beforeEach(() => {
		vi.resetAllMocks();
		mockStorage.clear();

		// Default Registry Behavior
		mockRegistry.getAllQuests.mockReturnValue([]);
		mockRegistry.getQuest.mockReturnValue(null);
		mockRegistry.isQuestLocked.mockReturnValue(false);

		service = new ProgressService(
			mockStorage,
			/** @type {import('../services/quest-registry-service.js').QuestRegistryService} */ (
				/** @type {import('./quest-registry-service.js').QuestRegistryService} */ (
					mockRegistry
				)
			),
		);
	});

	describe("Initialization", () => {
		it("should load default progress if storage is empty", () => {
			expect(service.progress.completedQuests).toEqual([]);
			expect(service.progress.unlockedQuests).toContain(
				"the-aura-of-sovereignty",
			);
			expect(mockStorage.getItem).toHaveBeenCalled();
		});

		it("should load existing progress from storage", () => {
			const savedState = {
				completedQuests: ["q1"],
				unlockedQuests: ["q1", "q2"],
			};
			mockStorage.items["legacys-end-progress"] = savedState;

			// Re-instantiate to trigger load
			service = new ProgressService(mockStorage, mockRegistry);
			expect(service.progress.completedQuests).toEqual(["q1"]);
		});
	});

	describe("State Management", () => {
		it("should set current quest and chapter", () => {
			service.setCurrentQuest("q1", "c1");
			expect(service.progress.currentQuest).toBe("q1");
			expect(service.progress.currentChapter).toBe("c1");
			expect(mockStorage.setItem).toHaveBeenCalled();
		});

		it("should update and get chapter state", () => {
			service.setChapterState("c1", { foundKey: true });
			expect(service.getChapterState("c1")).toEqual({ foundKey: true });

			// Merge update
			service.setChapterState("c1", { openedDoor: true });
			expect(service.getChapterState("c1")).toEqual({
				foundKey: true,
				openedDoor: true,
			});
		});

		it("should handle missing chapterStates object", () => {
			service.progress.chapterStates = {};

			// Should recover and set default
			service.setChapterState("c1", { visited: true });
			expect(service.progress.chapterStates).toBeDefined();
			expect(service.getChapterState("c1")).toEqual({ visited: true });

			// Get should handle missing safely
			service.progress.chapterStates = {};
			expect(service.getChapterState("c2")).toEqual({});
		});

		it("should return empty object for unknown chapter state", () => {
			expect(service.getChapterState("unknown")).toEqual({});
		});
	});

	describe("Progression Logic", () => {
		it("should complete a chapter", () => {
			service.completeChapter("c1");
			expect(service.progress.completedChapters).toContain("c1");
			expect(service.progress.stats.chaptersCompleted).toBe(1);
			expect(service.isChapterCompleted("c1")).toBe(true);
		});

		it("should ignoring completing an already completed chapter", () => {
			service.completeChapter("c1");
			service.completeChapter("c1");
			expect(service.progress.stats.chaptersCompleted).toBe(1); // Not incremented twice
		});

		it("should complete a quest", () => {
			const questId = "quest-1";
			mockRegistry.getQuest.mockReturnValue({
				id: questId,
				chapterIds: ["c1", "c2"],
				reward: { badge: "hero-badge" },
			});
			mockRegistry.getAllQuests.mockReturnValue([
				{ id: "quest-2", status: "active" },
			]);
			mockRegistry.isQuestLocked.mockReturnValue(false); // Unlock next

			service.completeQuest(questId);

			expect(service.progress.completedQuests).toContain(questId);
			expect(service.progress.achievements).toContain("hero-badge");
			expect(service.progress.completedChapters).toContain("c1"); // Auto-complete chapters
			expect(service.progress.completedChapters).toContain("c2");
		});

		it("should not double-complete a quest", () => {
			service.progress.completedQuests = ["q1"];
			service.completeQuest("q1");
			expect(service.progress.stats.questsCompleted).toBe(0); // Assuming init is 0
		});
	});

	describe("Reset Logic", () => {
		it("should reset all progress", () => {
			service.progress.completedQuests = ["q1"];
			service.resetProgress();
			expect(service.progress.completedQuests).toEqual([]);
			expect(service.progress.unlockedQuests).toHaveLength(1); // Default
		});

		it("should reset specific quest progress", () => {
			const questId = "q1";
			mockRegistry.getQuest.mockReturnValue({
				id: questId,
				chapterIds: ["c1", "c2"],
			});
			service.progress.completedQuests = ["q1", "q2"];
			service.progress.completedChapters = ["c1", "c2", "c3"];
			service.progress.currentQuest = "q1";

			service.resetQuestProgress(questId);

			expect(service.progress.completedQuests).toEqual(["q2"]); // q1 removed
			expect(service.progress.completedChapters).toEqual(["c3"]); // c1, c2 removed
			expect(service.progress.currentQuest).toBeNull(); // Reset because it was active
		});

		it("should clear chapter states when resetting quest", () => {
			const questId = "q1";
			mockRegistry.getQuest.mockReturnValue({
				id: questId,
				chapterIds: ["c1", "c2"],
			});
			service.progress.currentQuest = "q1";
			service.progress.chapterStates = {
				c1: { hasCollectedItem: true },
				c2: { visited: true },
				c3: { other: true },
			};

			service.resetQuestProgress(questId);

			const states = /** @type {any} */ (service.progress.chapterStates);
			expect(states.c1).toBeUndefined();
			expect(states.c2).toBeUndefined();
			expect(states.c3).toBeDefined(); // Belonged to another quest
		});

		it("should safely handle resetting unknown quest", () => {
			mockRegistry.getQuest.mockReturnValue(null);
			const stateBefore = JSON.stringify(service.progress);
			service.resetQuestProgress("unknown");
			expect(JSON.stringify(service.progress)).toBe(stateBefore);
		});
	});

	describe("Calculations", () => {
		it("should calculate quest progress percentage", () => {
			mockRegistry.getQuest.mockReturnValue({
				id: "q1",
				chapterIds: ["c1", "c2", "c3", "c4"],
			});
			service.progress.completedChapters = ["c1", "c3"]; // 50%

			expect(service.getQuestProgress("q1")).toBe(50);
		});

		it("should return 100% if quest is completed", () => {
			service.progress.completedQuests = ["q1"];
			expect(service.getQuestProgress("q1")).toBe(100);
		});

		it("should return 0% if quest metadata is missing", () => {
			mockRegistry.getQuest.mockReturnValue(null);
			expect(service.getQuestProgress("q1")).toBe(0);
		});

		it("should calculate overall progress", () => {
			mockRegistry.getAllQuests.mockReturnValue([
				{ id: "q1", status: "available" },
				{ id: "q2", status: "available" },
				{ id: "q3", status: "coming_soon" }, // Should be ignored
			]);
			service.progress.completedQuests = ["q1"]; // 1 out of 2 active quests

			expect(service.getOverallProgress()).toBe(50);
		});

		it("should return 0 if no quests exist", () => {
			mockRegistry.getAllQuests.mockReturnValue([]);
			expect(service.getOverallProgress()).toBe(0);
		});
	});

	describe("Convenience Methods", () => {
		it("should unlock achievement safely", () => {
			service.unlockAchievement("ach1");
			expect(service.progress.achievements).toContain("ach1");
			service.unlockAchievement("ach1"); // duplicate
			expect(service.progress.achievements.length).toBe(1);
		});

		it("should check availability and completion", () => {
			service.progress.unlockedQuests = ["q1"];
			service.progress.completedQuests = ["q2"];

			expect(service.isQuestAvailable("q1")).toBe(true);
			expect(service.isQuestAvailable("q2")).toBe(false);
			expect(service.isQuestCompleted("q2")).toBe(true);
		});

		it("should return immutable copy of progress", () => {
			const prog = /** @type {any} */ (service.getProgress());
			prog.newField = "test";
			expect(/** @type {any} */ (service.progress).newField).toBeUndefined();
		});
	});
});
