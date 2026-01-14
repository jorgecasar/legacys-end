import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../constants/events.js", () => ({
	EVENTS: {
		QUEST: {
			STARTED: "quest-started",
			COMPLETED: "quest-completed",
			CHAPTER_CHANGED: "chapter-changed",
			RETURN_TO_HUB: "return-to-hub",
		},
		UI: {
			THEME_CHANGED: "theme-changed",
			CONTEXT_CHANGED: "context-changed",
			DIALOG_OPENED: "dialog-opened",
			INTERACTION_LOCKED: "interaction-locked",
		},
	},
}));

vi.mock("../services/user-services.js", () => ({
	ServiceType: {
		LEGACY: "Legacy API",
		MOCK: "Mock Service",
		NEW: "New V2 API",
	},
}));

import { EVENTS } from "../constants/events.js";
// Fakes
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { ServiceType } from "../services/user-services.js";
import { GameSessionManager } from "./game-session-manager.js";

describe("GameSessionManager", () => {
	/** @type {GameSessionManager} */
	let manager;
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {FakeProgressService} */
	let fakeProgressService;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockControllers;
	/** @type {any} */
	let mockEventBus;
	/** @type {any} */
	let mockLogger;

	beforeEach(() => {
		// Use Fakes
		fakeGameState = new FakeGameStateService();

		// Setup mock registry for FakeProgressService
		const mockRegistry = {
			getQuest: vi.fn(),
			getAllQuests: vi.fn().mockReturnValue([]),
			isQuestLocked: vi.fn().mockReturnValue(false),
		};
		fakeProgressService = new FakeProgressService(
			/** @type {any} */ (mockRegistry),
		);

		// Mock dependency methods that are not purely state management if needed
		// For Progress, we might want to pre-seed some state
		vi.spyOn(fakeProgressService, "isQuestAvailable").mockReturnValue(true);

		// Mock QuestController (Still mocked as it has complex logic/side effects)
		mockQuestController = {
			startQuest: vi.fn().mockResolvedValue(undefined),
			continueQuest: vi.fn().mockResolvedValue(undefined),
			loadQuest: vi.fn().mockResolvedValue(undefined),
			jumpToChapter: vi.fn().mockReturnValue(true),
			completeChapter: vi.fn(),
			completeQuest: vi.fn(),
			returnToHub: vi.fn(),
			hasExitZone: vi.fn().mockReturnValue(false),
			isInQuest: vi.fn().mockReturnValue(true),
			currentQuest: { id: "test-quest", name: "Test Quest" },
			currentChapter: { id: "chapter-1", exitZone: {} },
			progressService: fakeProgressService,
		};

		// Mock Controllers
		mockControllers = {
			keyboard: {},
			interaction: {
				handleInteract: vi.fn(),
			},
			collision: {
				checkExitZone: vi.fn(),
			},
			zones: {
				checkZones: vi.fn(),
			},
		};

		// Mock EventBus
		mockEventBus = {
			on: vi.fn(),
			emit: vi.fn(),
			off: vi.fn(),
		};

		// Mock Logger
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		};

		manager = new GameSessionManager({
			gameState: fakeGameState,
			progressService: fakeProgressService,
			questController: mockQuestController,
			controllers: mockControllers,
			eventBus: mockEventBus,
			logger: mockLogger,
		});
	});

	describe("initialization", () => {
		it("should initialize with default state", () => {
			expect(manager.isLoading.get()).toBe(false);
			expect(manager.isInHub.get()).toBe(true);
			expect(manager.currentQuest.get()).toBeNull();
		});
	});

	describe("Regression Tests (Behavior-Driven)", () => {
		it("should subscribe to event bus events when setupEventListeners is called", () => {
			manager.setupEventListeners();
			expect(mockEventBus.on).toHaveBeenCalledWith(
				"chapter-changed",
				expect.any(Function),
			);
		});

		it("should reset hero position on chapter change", () => {
			manager.setupEventListeners();
			manager.currentQuest.set(/** @type {any} */ ({ id: "test-quest" }));
			const chapterChangeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "chapter-changed",
			)[1];

			const mockChapter = {
				id: "chapter-2",
				startPos: { x: 10, y: 10 },
			};

			chapterChangeCallback({ chapter: mockChapter, index: 1 });

			// Assertion on state
			expect(fakeGameState.heroPos.get()).toEqual({ x: 10, y: 10 });
		});

		it("should set hotSwitchState to 'mock' when entering a chapter with MOCK service type", () => {
			manager.setupEventListeners();
			const chapterChangeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === EVENTS.QUEST.CHAPTER_CHANGED,
			)[1];

			const mockChapter = {
				id: "assay-chamber",
				serviceType: ServiceType.MOCK,
				startPos: { x: 50, y: 50 },
			};

			chapterChangeCallback({ chapter: mockChapter, index: 2 });

			// Assertion on state
			expect(fakeGameState.hotSwitchState.get()).toBe("mock");
		});

		it("should clear hotSwitchState when entering a chapter with null service type", () => {
			manager.setupEventListeners();
			fakeGameState.hotSwitchState.set("mock"); // Pre-condition

			const chapterChangeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === EVENTS.QUEST.CHAPTER_CHANGED,
			)[1];

			const mockChapter = {
				id: "liberated-battlefield",
				serviceType: null,
				startPos: { x: 50, y: 50 },
			};

			chapterChangeCallback({ chapter: mockChapter, index: 3 });

			// Assertion on state
			expect(fakeGameState.hotSwitchState.get()).toBeNull();
		});

		it("should handle serviceType mapping fallbacks", () => {
			manager.setupEventListeners();
			fakeGameState.hotSwitchState.set("mock"); // Pre-condition

			const chapterChangeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === EVENTS.QUEST.CHAPTER_CHANGED,
			)[1];

			const mockChapter = {
				id: "unknown",
				serviceType: "unknown-type",
				startPos: { x: 0, y: 0 },
			};

			chapterChangeCallback({ chapter: mockChapter, index: 4 });

			// Assertion on state
			expect(fakeGameState.hotSwitchState.get()).toBeNull();
		});

		it("should not set hero position if startPos is missing", () => {
			manager.setupEventListeners();
			const initialPos = { x: 50, y: 50 }; // Default
			fakeGameState.heroPos.set(initialPos);

			const callback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ c) => c[0] === EVENTS.QUEST.CHAPTER_CHANGED,
			)[1];

			callback({ chapter: { id: "no-pos" }, index: 0 });

			// Assertion: State remains same
			expect(fakeGameState.heroPos.get()).toEqual(initialPos);
		});
	});

	describe("getGameState", () => {
		it("should return combined game state", () => {
			const state = manager.getGameState();

			expect(state).toMatchObject({
				heroPos: { x: 50, y: 15 }, // Default from Service
				isLoading: false,
				isInHub: true,
				currentQuest: null,
			});
		});
	});

	describe("startQuest", () => {
		it("should start a quest successfully", async () => {
			const questId = "test-quest";
			await manager.startQuest(questId);

			expect(mockQuestController.startQuest).toHaveBeenCalledWith(questId);
			expect(manager.isInHub.get()).toBe(false);
			expect(manager.currentQuest.get()?.id).toBe(questId);
		});

		it("should handle loading state", async () => {
			await manager.startQuest("test-quest");
			expect(manager.isLoading.get()).toBe(false);
		});
	});

	describe("continueQuest", () => {
		it("should continue a quest from last checkpoint", async () => {
			const questId = "test-quest";
			await manager.continueQuest(questId);

			expect(mockQuestController.continueQuest).toHaveBeenCalledWith(questId);
			expect(manager.isInHub.get()).toBe(false);
			expect(manager.currentQuest.get()?.id).toBe(questId);
		});
	});

	describe("jumpToChapter", () => {
		it("should jump to chapter if successful", () => {
			const result = manager.jumpToChapter("chapter-2");

			expect(mockQuestController.jumpToChapter).toHaveBeenCalledWith(
				"chapter-2",
			);
			expect(result).toBe(true);
		});

		it("should reset loading state if jump fails", () => {
			mockQuestController.jumpToChapter.mockReturnValue(false);

			manager.jumpToChapter("chapter-2");
		});
	});

	describe("returnToHub", () => {
		it("should return to hub and reset state", async () => {
			manager.currentQuest.set(/** @type {any} */ ({ id: "test-quest" }));
			manager.isInHub.set(false);

			await manager.returnToHub();

			expect(mockQuestController.returnToHub).toHaveBeenCalled();
			expect(manager.currentQuest.get()).toBeNull();
			expect(manager.isInHub.get()).toBe(true);
		});
	});

	describe("completeQuest", () => {
		it("should complete a quest and update state", () => {
			manager.completeQuest();
			expect(fakeGameState.isQuestCompleted.get()).toBe(true);
		});
	});
	describe("loadChapter", () => {
		it("should load quest if not current and jump to chapter", async () => {
			manager.currentQuest.set(null);
			// fakeProgress is already seeded to return true for available
			mockQuestController.jumpToChapter.mockReturnValue(true);
			mockQuestController.currentQuest = { id: "test-quest" };

			await manager.loadChapter("test-quest", "chapter-2");

			// Ensure service was queried ( spy on the fake method if we really care about the call interactions, but behavior is key)
			expect(fakeProgressService.isQuestAvailable).toHaveBeenCalledWith(
				"test-quest",
			);

			expect(mockQuestController.loadQuest).toHaveBeenCalledWith("test-quest");
			expect(mockQuestController.jumpToChapter).toHaveBeenCalledWith(
				"chapter-2",
			);
			expect(manager.isInHub.get()).toBe(false);
		});

		it("should redirect to hub if quest not available", async () => {
			manager.currentQuest.set(null);
			vi.spyOn(fakeProgressService, "isQuestAvailable").mockReturnValue(false);
			const returnSpy = vi.spyOn(manager, "returnToHub");

			await manager.loadChapter("test-quest", "chapter-1");

			expect(returnSpy).toHaveBeenCalledWith(true);
			expect(mockQuestController.loadQuest).not.toHaveBeenCalled();
		});

		it("should fallback to continueQuest if jumpToChapter fails", async () => {
			manager.currentQuest.set(/** @type {any} */ ({ id: "test-quest" }));
			mockQuestController.jumpToChapter.mockReturnValue(false);

			await manager.loadChapter("test-quest", "chapter-X");

			expect(mockQuestController.jumpToChapter).toHaveBeenCalledWith(
				"chapter-X",
			);
			expect(mockQuestController.continueQuest).toHaveBeenCalledWith(
				"test-quest",
			);
		});

		it("should handle errors gracefully", async () => {
			manager.currentQuest.set(null);
			mockQuestController.loadQuest.mockRejectedValue(new Error("Load failed"));

			await manager.loadChapter("test-quest", "chapter-1");

			expect(manager.isLoading.get()).toBe(false);
		});
	});

	describe("State Restoration & Guards", () => {
		it("should prevent recursive returnToHub calls", () => {
			manager.isInHub.set(true);
			manager.currentQuest.set(null);
			const useCaseSpy = vi.spyOn(manager._returnToHubUseCase, "execute");

			manager.returnToHub();

			expect(useCaseSpy).not.toHaveBeenCalled();
		});
	});
});
