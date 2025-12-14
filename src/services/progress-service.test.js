import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as QuestRegistry from "../quests/quest-registry.js";
import { ProgressService } from "./progress-service.js";

// Mock dependencies
vi.mock("../quests/quest-registry.js", () => ({
	getQuest: vi.fn(),
	isQuestLocked: vi.fn(),
	getAllQuests: vi.fn(),
	QUESTS: {},
}));

describe("ProgressService", () => {
	let progressService;
	let mockStorage;

	beforeEach(() => {
		mockStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		};
		vi.clearAllMocks();

		// Default mock behavior
		mockStorage.getItem.mockReturnValue(null);
		QuestRegistry.getAllQuests.mockReturnValue([]);

		// Setup default QUESTS mock
		QuestRegistry.QUESTS.testQuest1 = {
			id: "test-quest-1",
			name: "Test Quest 1",
			subtitle: "Subtitle",
			type: "quest",
			description: "Description",
			legacyProblem: "Problem",
			prerequisites: [],
			shortcuts: [],
			difficulty: "easy",
			icon: "icon",
			estimatedTime: "10m",
			status: "available",
			chapterIds: ["c1", "c2"],
		};
		QuestRegistry.QUESTS.testQuest2 = {
			id: "test-quest-2",
			name: "Test Quest 2",
			subtitle: "Subtitle",
			type: "quest",
			description: "Description",
			legacyProblem: "Problem",
			prerequisites: [],
			shortcuts: [],
			difficulty: "easy",
			icon: "icon",
			estimatedTime: "10m",
			status: "available",
			chapterIds: ["c3"],
		};

		progressService = new ProgressService(mockStorage);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize with default progress if no saved data", () => {
		const progress = progressService.getProgress();
		expect(progress.completedQuests).toEqual([]);
		expect(progress.unlockedQuests).toContain("the-aura-of-sovereignty");
	});

	it("should save progress to mockStorage", () => {
		progressService.saveProgress();
		expect(mockStorage.setItem).toHaveBeenCalledWith(
			"legacys-end-progress",
			expect.any(Object),
		);
	});

	it("should complete a chapter", () => {
		progressService.completeChapter("c1");
		expect(progressService.isChapterCompleted("c1")).toBe(true);
		expect(progressService.progress.stats.chaptersCompleted).toBe(1);
		expect(mockStorage.setItem).toHaveBeenCalled();
	});

	it("should not double-complete a chapter", () => {
		progressService.completeChapter("c1");
		progressService.completeChapter("c1");
		expect(progressService.progress.stats.chaptersCompleted).toBe(1);
	});

	it("should complete a quest and unlock achievement", () => {
		const questMock = {
			id: "quest-1",
			chapterIds: ["c1"],
			reward: { badge: "badge-1" },
		};
		QuestRegistry.getQuest.mockReturnValue(questMock);
		QuestRegistry.isQuestLocked.mockReturnValue(false);

		progressService.completeQuest("quest-1");

		expect(progressService.isQuestCompleted("quest-1")).toBe(true);
		expect(progressService.progress.achievements).toContain("badge-1");
		expect(progressService.progress.stats.questsCompleted).toBe(1);
		// Should auto-complete chapters if not done
		expect(progressService.isChapterCompleted("c1")).toBe(true);
	});

	it("should reset progress", () => {
		progressService.completeChapter("c1");
		progressService.resetProgress();

		expect(progressService.isChapterCompleted("c1")).toBe(false);
		expect(progressService.progress.stats.chaptersCompleted).toBe(0);
		expect(mockStorage.removeItem).toHaveBeenCalled();
	});

	it("should unlock new quests based on prerequisites", () => {
		// Mock getAllQuests to return a locked quest
		QuestRegistry.getAllQuests.mockReturnValue([
			{
				id: "locked-quest",
				type: "quest",
			},
		]);

		// Setup isQuestLocked to return false (unlocked) when called
		QuestRegistry.isQuestLocked.mockReturnValue(false);

		progressService.unlockNewQuests();

		expect(progressService.progress.unlockedQuests).toContain("locked-quest");
	});

	it("should reset specific quest progress", () => {
		QuestRegistry.getQuest.mockReturnValue({
			id: "q1",
			chapterIds: ["c1", "c2"],
		});

		progressService.setCurrentQuest("q1", "c1");
		progressService.completeChapter("c1");
		progressService.completeQuest("q1");

		progressService.resetQuestProgress("q1");

		expect(progressService.isQuestCompleted("q1")).toBe(false);
		expect(progressService.isChapterCompleted("c1")).toBe(false);
		expect(progressService.progress.currentQuest).toBeNull();
	});

	it("should calculate quest progress percentage", () => {
		QuestRegistry.getQuest.mockReturnValue({
			id: "q1",
			chapterIds: ["c1", "c2", "c3", "c4"],
		});

		progressService.completeChapter("c1");

		expect(progressService.getQuestProgress("q1")).toBe(25);
	});
});
