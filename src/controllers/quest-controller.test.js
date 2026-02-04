import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { QuestController } from "./quest-controller.js";

describe("QuestController", () => {
	/** @type {any} */
	let host;
	/** @type {QuestController} */
	let controller;
	/** @type {FakeProgressService} */
	let fakeProgressService;
	/** @type {any} */
	let mockQuest;
	/** @type {any} */
	let mockRegistry;
	/** @type {any} */
	let mockQuestState;
	/** @type {any} */
	let mockWorldState;
	/** @type {any} */
	let mockSessionService;

	beforeEach(async () => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapterIds: ["chapter-1"],
			chapters: { "chapter-1": { id: "chapter-1", title: "Chapter 1" } },
		};

		mockRegistry = {
			loadQuestData: vi.fn().mockResolvedValue(mockQuest),
			getAvailableQuests: vi.fn().mockReturnValue([mockQuest]),
			getQuest: vi.fn().mockReturnValue(mockQuest),
		};

		mockQuestState = {
			setQuestTitle: vi.fn(),
			setTotalChapters: vi.fn(),
			setCurrentChapterNumber: vi.fn(),
			setCurrentChapterId: vi.fn(),
			setLevelTitle: vi.fn(),
			resetQuestState: vi.fn(),
			resetChapterState: vi.fn(),
			setIsQuestCompleted: vi.fn(),
			setHasCollectedItem: vi.fn(),
			setIsRewardCollected: vi.fn(),
		};

		mockWorldState = {
			setPaused: vi.fn(),
			setShowDialog: vi.fn(),
			resetSlideIndex: vi.fn(),
		};

		mockSessionService = {
			currentQuest: new Signal.State(null),
			isInHub: new Signal.State(true),
			setCurrentQuest: vi.fn(),
			setIsInHub: vi.fn(),
			setLoading: vi.fn(),
		};

		fakeProgressService = new FakeProgressService(
			/** @type {any} */ (mockRegistry),
		);
		fakeProgressService.progress.unlockedQuests = ["test-quest"];

		// Use explicit service injection instead of fighting with @lit/context mock
		controller = new QuestController(host, {
			registry: mockRegistry,
			progressService: fakeProgressService,
			state: mockQuestState,
			worldState: mockWorldState,
			sessionService: mockSessionService,
			preloaderService: /** @type {any} */ ({
				preloadChapter: vi.fn(),
				preloadImage: vi.fn(),
				preloadImages: vi.fn(),
			}),
		});
	});

	it("should initialize and add itself to the host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	it("should start a quest and set the currentQuest", async () => {
		const result = await controller.startQuest("test-quest");
		expect(result.success).toBe(true);
		expect(controller.currentQuest?.id).toBe("test-quest");
		expect(controller.currentChapter?.id).toBe("chapter-1");
		expect(mockQuestState.setQuestTitle).toHaveBeenCalledWith("Test Quest");
	});

	it("should reset quest progress and world state when starting a quest", async () => {
		const resetSpy = vi.spyOn(fakeProgressService, "resetQuestProgress");
		await controller.startQuest("test-quest");
		expect(resetSpy).toHaveBeenCalledWith("test-quest");
		expect(mockWorldState.setPaused).toHaveBeenCalledWith(false);
		expect(mockWorldState.setShowDialog).toHaveBeenCalledWith(false);
		expect(mockWorldState.resetSlideIndex).toHaveBeenCalled();
	});

	it("should fail to start a quest if locked", async () => {
		fakeProgressService.progress.unlockedQuests = [];
		const result = await controller.startQuest("test-quest");

		expect(result.success).toBe(false);
		expect(controller.currentQuest).toBeNull();
	});

	it("should handle return to hub", async () => {
		await controller.startQuest("test-quest");
		await controller.returnToHub();

		expect(controller.currentQuest).toBeNull();
		expect(mockQuestState.resetQuestState).toHaveBeenCalled();
	});

	it("should reset world state when moving to next chapter", async () => {
		mockQuest.chapterIds = ["chapter-1", "chapter-2"];
		mockQuest.chapters["chapter-2"] = { id: "chapter-2", title: "Chapter 2" };

		await controller.startQuest("test-quest");

		// Reset mocks to clear startQuest calls
		mockWorldState.setPaused.mockClear();
		mockWorldState.setShowDialog.mockClear();
		mockWorldState.resetSlideIndex.mockClear();

		controller.nextChapter();

		expect(mockWorldState.setPaused).toHaveBeenCalledWith(false);
		expect(mockWorldState.setShowDialog).toHaveBeenCalledWith(false);
		expect(mockWorldState.resetSlideIndex).toHaveBeenCalled();
		expect(controller.currentChapter?.id).toBe("chapter-2");
	});

	it("should advance when advanceChapter is called even if exit zone is present", async () => {
		mockQuest.chapterIds = ["chapter-1", "chapter-2"];
		mockQuest.chapters["chapter-1"] = {
			id: "chapter-1",
			title: "Chapter 1",
			exitZone: { x: 50, y: 50, width: 10, height: 10 },
		};
		mockQuest.chapters["chapter-2"] = { id: "chapter-2", title: "Chapter 2" };

		await controller.startQuest("test-quest");
		expect(controller.currentChapter?.id).toBe("chapter-1");

		await controller.advanceChapter();

		expect(controller.currentChapter?.id).toBe("chapter-2");
	});

	it("should NOT advance automatically when completeChapter is called if exit zone is present", async () => {
		mockQuest.chapterIds = ["chapter-1", "chapter-2"];
		mockQuest.chapters["chapter-1"] = {
			id: "chapter-1",
			title: "Chapter 1",
			exitZone: { x: 50, y: 50, width: 10, height: 10 },
		};
		mockQuest.chapters["chapter-2"] = { id: "chapter-2", title: "Chapter 2" };

		await controller.startQuest("test-quest");

		controller.completeChapter();

		expect(controller.currentChapter?.id).toBe("chapter-1"); // Should still be chapter 1
	});
});
