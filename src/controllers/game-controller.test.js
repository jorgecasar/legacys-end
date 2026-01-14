import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../constants/events.js";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
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
	/** @type {FakeGameStateService} */
	let fakeGameState;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		fakeGameState = new FakeGameStateService();

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			gameState: fakeGameState,
			commandBus: {
				execute: vi.fn().mockResolvedValue(undefined),
			},
			questController: {
				hasNextChapter: vi.fn(),
				isLastChapter: vi.fn(),
			},
			sessionManager: {
				currentQuest: { get: vi.fn() },
				questController: { isLastChapter: vi.fn(), hasNextChapter: vi.fn() },
				completeQuest: vi.fn(),
				completeChapter: vi.fn(),
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
		expect(command.sessionManager).toBe(context.sessionManager);
	});

	describe("handleLevelCompleted", () => {
		beforeEach(() => {
			gameService = new GameService();
			controller = new GameController(host, { ...context, gameService });
			controller.hostConnected();
		});

		it("should mark item as collected if NOT yet collected", () => {
			// Fake state: Reward NOT collected
			fakeGameState.isRewardCollected.set(false);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(fakeGameState.hasCollectedItem.get()).toBe(true);
			// commandBus not executed because we didn't meet advance condition?
			// Logic: (!isCurrentLevelCompleted) -> setCollectedItem(true); return;
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});

		it("should advance chapter if reward IS collected AND has next chapter", () => {
			// Fake state: Reward COLLECTED
			fakeGameState.isRewardCollected.set(true);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(context.commandBus.execute).toHaveBeenCalled();
			const command = context.commandBus.execute.mock.calls[0][0];
			expect(command.constructor.name).toBe("AdvanceChapterCommand");
			expect(command.sessionManager).toBe(context.sessionManager);
		});

		it("should mark item as collected if reward collected but NO next chapter (Fallback/Last Level)", () => {
			// Fake state: Reward COLLECTED + NO Next Chapter
			fakeGameState.isRewardCollected.set(true);
			context.questController.hasNextChapter.mockReturnValue(false);

			controller.handleLevelCompleted();

			// Should fall through to "just mark collected" path
			// In original test it expected setCollectedItem(true).
			// If isRewardCollected is already true, setting it to true again is idempotent.
			// The crucial thing is that it does NOT execute AdvanceChapterCommand.
			expect(fakeGameState.hasCollectedItem.get()).toBe(true);
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});
	});
});
