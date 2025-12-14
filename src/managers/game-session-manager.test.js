import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameSessionManager } from "./game-session-manager.js";

describe("GameSessionManager", () => {
	let manager;
	let mockGameState;
	let mockProgressService;
	let mockQuestController;
	let mockRouter;
	let mockControllers;

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
		};

		// Mock ProgressService
		mockProgressService = {
			isQuestAvailable: vi.fn().mockReturnValue(true),
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

		manager = new GameSessionManager({
			gameState: mockGameState,
			progressService: mockProgressService,
			questController: mockQuestController,
			router: mockRouter,
			controllers: mockControllers,
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
				expect.objectContaining({ type: "navigation", location: "quest" })
			);
		});

		it("should handle loading state", async () => {
			const notifySpy = vi.spyOn(manager, "notify");

			await manager.startQuest("test-quest");

			expect(notifySpy).toHaveBeenCalledWith({ type: "loading", isLoading: true });
			expect(notifySpy).toHaveBeenCalledWith({ type: "loading", isLoading: false });
		});
	});

	describe("continueQuest", () => {
		it("should continue a quest from last checkpoint", async () => {
			await manager.continueQuest("test-quest");

			expect(mockQuestController.continueQuest).toHaveBeenCalledWith("test-quest");
			expect(manager.isInHub).toBe(false);
		});
	});

	describe("jumpToChapter", () => {
		it("should jump to chapter if successful", () => {
			const result = manager.jumpToChapter("chapter-2");

			expect(mockQuestController.jumpToChapter).toHaveBeenCalledWith("chapter-2");
			expect(result).toBe(true);
		});

		it("should reset loading state if jump fails", () => {
			mockQuestController.jumpToChapter.mockReturnValue(false);
			const notifySpy = vi.spyOn(manager, "notify");

			manager.jumpToChapter("chapter-2");

			expect(notifySpy).toHaveBeenCalledWith({ type: "loading", isLoading: false });
		});
	});

	describe("returnToHub", () => {
		it("should return to hub and reset state", () => {
			manager.currentQuest = { id: "test-quest" };
			manager.isInHub = false;
			const notifySpy = vi.spyOn(manager, "notify");

			manager.returnToHub();

			expect(mockQuestController.returnToHub).toHaveBeenCalled();
			expect(manager.currentQuest).toBeNull();
			expect(manager.isInHub).toBe(true);
			expect(notifySpy).toHaveBeenCalledWith(
				expect.objectContaining({ type: "navigation", location: "hub" })
			);
		});
	});

	describe("handleMove", () => {
		it("should coordinate movement with controllers", () => {
			manager.handleMove(5, 3);

			expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(55, 53);
			expect(mockControllers.zones.checkZones).toHaveBeenCalledWith(55, 53);
		});

		it("should clamp position within bounds", () => {
			manager.handleMove(100, 100);

			expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(98, 98);
		});
	});

	describe("togglePause", () => {
		it("should toggle pause state when not in hub", () => {
			manager.isInHub = false;

			manager.togglePause();

			expect(mockGameState.setPaused).toHaveBeenCalledWith(true);
		});

		it("should not toggle pause when in hub", () => {
			manager.isInHub = true;

			manager.togglePause();

			expect(mockGameState.setPaused).not.toHaveBeenCalled();
		});
	});

	describe("triggerLevelTransition", () => {
		it("should trigger evolution and complete chapter", () => {
			vi.useFakeTimers();

			manager.triggerLevelTransition();

			expect(mockGameState.setEvolving).toHaveBeenCalledWith(true);

			vi.advanceTimersByTime(500);

			expect(mockQuestController.completeChapter).toHaveBeenCalled();
			expect(mockGameState.setEvolving).toHaveBeenCalledWith(false);

			vi.useRealTimers();
		});
	});
});
