import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameSessionManager } from "./game-session-manager.js";

describe("GameSessionManager", () => {
	/** @type {GameSessionManager} */
	let manager;
	/** @type {any} */
	let mockGameState;
	/** @type {any} */
	let mockProgressService;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockRouter;
	/** @type {any} */
	let mockControllers;
	/** @type {any} */
	let mockEventBus;

	beforeEach(() => {
		// Mock GameStateService
		mockGameState = {
			getState: vi.fn().mockReturnValue({
				heroPos: { x: 50, y: 50 },
				hasCollectedItem: false,
				isPaused: false,
				isEvolving: false,
			}),
			subscribe: vi.fn(),
			setHeroPosition: vi.fn(),
			setPaused: vi.fn(),
			setEvolving: vi.fn(),
			setState: vi.fn(),
			resetChapterState: vi.fn(),
			setThemeMode: vi.fn(),
			setHotSwitchState: vi.fn(),
		};

		// Mock ProgressService
		mockProgressService = {
			isQuestAvailable: vi.fn().mockReturnValue(true),
			getChapterState: vi.fn().mockReturnValue({}),
		};

		// Mock QuestController
		mockQuestController = {
			startQuest: vi.fn().mockResolvedValue(undefined),
			continueQuest: vi.fn().mockResolvedValue(undefined),
			jumpToChapter: vi.fn().mockReturnValue(true),
			completeChapter: vi.fn(),
			completeQuest: vi.fn(),
			returnToHub: vi.fn(),
			hasExitZone: vi.fn().mockReturnValue(false),
			isInQuest: vi.fn().mockReturnValue(true),
			currentQuest: { id: "test-quest", name: "Test Quest" },
			currentChapter: { id: "chapter-1", exitZone: {} },
		};

		// Mock Router
		mockRouter = {
			navigate: vi.fn(),
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

		manager = new GameSessionManager({
			gameState: mockGameState,
			progressService: mockProgressService,
			questController: mockQuestController,
			router: mockRouter,
			controllers: mockControllers,
			eventBus: mockEventBus,
		});
	});

	describe("initialization", () => {
		it("should initialize with default state", () => {
			expect(manager.isLoading).toBe(false);
			expect(manager.isInHub).toBe(true);
			expect(manager.currentQuest).toBeNull();
		});

		it("should subscribe to game state changes", () => {
			expect(mockGameState.subscribe).toHaveBeenCalled();
		});
	});

	describe("Regression Tests", () => {
		it("should subscribe to event bus events when setupEventListeners is called (Fix: Hero position/URL not updating)", () => {
			manager.setupEventListeners();
			expect(mockEventBus.on).toHaveBeenCalledWith(
				"quest-started",
				expect.any(Function),
			);
			expect(mockEventBus.on).toHaveBeenCalledWith(
				"chapter-changed",
				expect.any(Function),
			);
			expect(mockEventBus.on).toHaveBeenCalledWith(
				"quest-completed",
				expect.any(Function),
			);
			expect(mockEventBus.on).toHaveBeenCalledWith(
				"return-to-hub",
				expect.any(Function),
			);
		});

		it("should handle quest-completed event by updating game state (Fix: Quest completion UI not showing)", () => {
			manager.setupEventListeners();
			const completeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "quest-completed",
			)[1];

			completeCallback({ quest: { name: "Test Quest", reward: {} } });

			expect(mockGameState.setState).toHaveBeenCalledWith({
				isQuestCompleted: true,
			});
		});

		it("should reset hero position on chapter change (Fix: Hero stuck at previous position)", () => {
			manager.setupEventListeners();
			manager.currentQuest = /** @type {any} */ ({ id: "test-quest" });
			const chapterChangeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "chapter-changed",
			)[1];

			const mockChapter = {
				id: "chapter-2",
				startPos: { x: 10, y: 10 },
			};

			chapterChangeCallback({ chapter: mockChapter, index: 1 });

			expect(mockRouter.navigate).toHaveBeenCalled();
			expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(10, 10);
		});

		it("should clear completion state when starting quest (Fix: Completion UI showing on restart)", async () => {
			// Setup initial state as "completed"
			mockGameState.getState.mockReturnValue({ isQuestCompleted: true });

			await manager.startQuest("test-quest");

			// Verify state reset was called
			expect(mockGameState.setState).toHaveBeenCalledWith({
				isQuestCompleted: false,
				isPaused: false,
			});
		});

		it("should clear completion state when returning to hub (Fix: Completion UI showing on re-entry)", () => {
			mockGameState.getState.mockReturnValue({ isQuestCompleted: true });
			manager.setupEventListeners();
			const returnCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "return-to-hub",
			)[1];

			returnCallback();

			expect(mockGameState.setState).toHaveBeenCalledWith({
				isQuestCompleted: false,
				isPaused: false,
			});
		});

		it("should handle theme-changed event (Refactor: Event-driven zones)", () => {
			manager.setupEventListeners();
			const themeCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "theme-changed",
			)[1];

			themeCallback({ theme: "dark" });

			expect(mockGameState.setThemeMode).toHaveBeenCalledWith("dark");
		});

		it("should handle context-changed event (Refactor: Event-driven zones)", () => {
			manager.setupEventListeners();
			// Mock initial state to be different
			mockGameState.getState.mockReturnValue({ hotSwitchState: "legacy" });

			const contextCallback = mockEventBus.on.mock.calls.find(
				(/** @type {any} */ call) => call[0] === "context-changed",
			)[1];

			contextCallback({ context: "new" });

			expect(mockGameState.setHotSwitchState).toHaveBeenCalledWith("new");
		});
	});

	describe("getGameState", () => {
		it("should return combined game state", () => {
			const state = manager.getGameState();

			expect(state).toMatchObject({
				heroPos: { x: 50, y: 50 },
				isLoading: false,
				isInHub: true,
				currentQuest: null,
			});
		});
	});

	describe("startQuest", () => {
		it("should start a quest successfully", async () => {
			const notifySpy = vi.spyOn(manager, "notify");

			await manager.startQuest("test-quest");

			expect(mockQuestController.startQuest).toHaveBeenCalledWith("test-quest");
			expect(manager.isInHub).toBe(false);
			expect(manager.currentQuest).toEqual(mockQuestController.currentQuest);
			expect(notifySpy).toHaveBeenCalledWith(
				expect.objectContaining({ type: "navigation", location: "quest" }),
			);
		});

		it("should handle loading state", async () => {
			const notifySpy = vi.spyOn(manager, "notify");

			await manager.startQuest("test-quest");

			expect(notifySpy).toHaveBeenCalledWith({
				type: "loading",
				isLoading: true,
			});
			expect(notifySpy).toHaveBeenCalledWith({
				type: "loading",
				isLoading: false,
			});
		});
	});

	describe("continueQuest", () => {
		it("should continue a quest from last checkpoint", async () => {
			await manager.continueQuest("test-quest");

			expect(mockQuestController.continueQuest).toHaveBeenCalledWith(
				"test-quest",
			);
			expect(manager.isInHub).toBe(false);
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
			const notifySpy = vi.spyOn(manager, "notify");

			manager.jumpToChapter("chapter-2");

			expect(notifySpy).toHaveBeenCalledWith({
				type: "loading",
				isLoading: false,
			});
		});
	});

	describe("returnToHub", () => {
		it("should return to hub and reset state", () => {
			manager.currentQuest = /** @type {any} */ ({ id: "test-quest" });
			manager.isInHub = false;
			const notifySpy = vi.spyOn(manager, "notify");

			manager.returnToHub();

			expect(mockQuestController.returnToHub).toHaveBeenCalled();
			expect(manager.currentQuest).toBeNull();
			expect(manager.isInHub).toBe(true);
			expect(notifySpy).toHaveBeenCalledWith(
				expect.objectContaining({ type: "navigation", location: "hub" }),
			);
		});
	});
});
