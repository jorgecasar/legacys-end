import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../constants/events.js";
import { GameService } from "../services/game-service.js";
import { GameController } from "./game-controller.js";

describe("GameController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameController} */
	let controller;
	/** @type {GameService} */
	let gameService;
	/** @type {import("vitest").Mock} */
	let setLevel;
	/** @type {import("vitest").Mock} */
	let getState;

	/** @type {any} */
	let context;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			gameState: {
				setShowDialog: vi.fn(),
				setCollectedItem: vi.fn(),
				getState: vi.fn(() => ({ isRewardCollected: false })),
			},
			commandBus: {
				execute: vi.fn().mockResolvedValue(undefined),
			},
			questController: {
				hasNextChapter: vi.fn(),
			},
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
			},
		};

		setLevel = vi.fn();
		getState = vi.fn().mockReturnValue({ level: "chapter-1" });

		// Mock window.location
		window.history.replaceState({}, "", "/");
	});

	afterEach(() => {
		// @ts-expect-error
		delete window.game;
		vi.restoreAllMocks();
	});

	it("should not enable debug mode by default", () => {
		gameService = new GameService();
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		expect(controller.isEnabled).toBe(false);
		// @ts-expect-error
		expect(window.game).toBeUndefined();
	});

	it("should enable debug mode when ?debug is in URL", () => {
		window.history.replaceState({}, "", "/?debug");
		gameService = new GameService({ setLevel, getState });
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		expect(controller.isEnabled).toBe(true);
	});

	it("should NOT expose window.game even in debug mode", () => {
		window.history.replaceState({}, "", "/?debug");
		gameService = new GameService({ setLevel, getState });
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		// @ts-expect-error
		expect(window.game).toBeUndefined();
	});

	it("should log instructions and call getState on enable", () => {
		window.history.replaceState({}, "", "/?debug");

		gameService = new GameService({ getState });
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		expect(context.logger.info).toHaveBeenCalledWith(
			expect.stringContaining("DEBUG MODE ENABLED"),
		);
		expect(getState).toHaveBeenCalled();
	});

	it("should throw if gameService is missing in options", () => {
		expect(() => {
			new GameController(host, /** @type {any} */ ({}));
		}).toThrow("GameController requires a gameService option");
	});

	it("should remove event listeners on disconnect", () => {
		gameService = new GameService();
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		controller.hostDisconnected();

		expect(context.eventBus.off).toHaveBeenCalledWith(
			EVENTS.UI.LEVEL_COMPLETED,
			controller.handleLevelCompleted,
		);
		expect(context.eventBus.off).toHaveBeenCalledWith(
			EVENTS.UI.EXIT_ZONE_REACHED,
			controller.handleExitZoneReached,
		);
	});

	it("should handle EXIT_ZONE_REACHED event by executing AdvanceChapterCommand", () => {
		gameService = new GameService();
		controller = new GameController(host, { ...context, gameService });
		controller.hostConnected();

		controller.handleExitZoneReached();

		expect(context.commandBus.execute).toHaveBeenCalled();
		const command = context.commandBus.execute.mock.calls[0][0];
		expect(command.constructor.name).toBe("AdvanceChapterCommand");
	});

	describe("handleLevelCompleted", () => {
		beforeEach(() => {
			gameService = new GameService();
			controller = new GameController(host, { ...context, gameService });
			controller.hostConnected();
		});

		it("should mark item as collected if NOT yet collected", () => {
			// Mock state: Reward NOT collected
			context.gameState.getState.mockReturnValue({ isRewardCollected: false });
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(context.gameState.setCollectedItem).toHaveBeenCalledWith(true);
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});

		it("should advance chapter if reward IS collected AND has next chapter", () => {
			// Mock state: Reward COLLECTED + Has Next Chapter
			context.gameState.getState.mockReturnValue({ isRewardCollected: true });
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(context.commandBus.execute).toHaveBeenCalled();
			const command = context.commandBus.execute.mock.calls[0][0];
			expect(command.constructor.name).toBe("AdvanceChapterCommand");
		});

		it("should mark item as collected if reward collected but NO next chapter (Fallback/Last Level)", () => {
			// Mock state: Reward COLLECTED + NO Next Chapter
			context.gameState.getState.mockReturnValue({ isRewardCollected: true });
			context.questController.hasNextChapter.mockReturnValue(false);

			controller.handleLevelCompleted();

			// Should fall through to "just mark collected" path which logs "Level Goal Reached"
			expect(context.gameState.setCollectedItem).toHaveBeenCalledWith(true);
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});
	});
});
