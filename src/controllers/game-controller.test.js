import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { GameController } from "./game-controller.js";

describe("GameController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameController} */
	let controller;
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
			heroState: fakeGameState.heroState,
			questState: fakeGameState.questState,
			worldState: fakeGameState.worldState,
			commandBus: {
				execute: vi.fn().mockResolvedValue(undefined),
			},
			questController: {
				hasNextChapter: vi.fn(),
				isLastChapter: vi.fn(),
			},
			questLoader: {
				completeQuest: vi.fn(),
				completeChapter: vi.fn(),
				advanceQuest: vi.fn(),
			},
			logger: {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
			},
		};

		// Mock window.location
		window.history.replaceState({}, "", "/");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should not enable debug mode by default", () => {
		controller = new GameController(host, { ...context });
		controller.hostConnected();

		expect(controller.isEnabled).toBe(false);
	});

	it("should enable debug mode when ?debug is in URL", () => {
		window.history.replaceState({}, "", "/?debug");
		controller = new GameController(host, { ...context });
		controller.hostConnected();

		expect(controller.isEnabled).toBe(true);
	});

	it("should log instructions on enable", () => {
		window.history.replaceState({}, "", "/?debug");
		controller = new GameController(host, { ...context });
		controller.hostConnected();

		expect(context.logger.info).toHaveBeenCalledWith(
			expect.stringContaining("DEBUG MODE ENABLED"),
		);
	});

	it("should handle exit zone reached by executing AdvanceChapterCommand", () => {
		controller = new GameController(host, { ...context });
		controller.hostConnected();

		controller.handleExitZoneReached();

		expect(context.commandBus.execute).toHaveBeenCalled();
		const command = context.commandBus.execute.mock.calls[0][0];
		expect(command.constructor.name).toBe("AdvanceChapterCommand");
		expect(command.questLoader).toBe(context.questLoader);
	});

	describe("handleLevelCompleted", () => {
		beforeEach(() => {
			controller = new GameController(host, { ...context });
			controller.hostConnected();
		});

		it("should mark item as collected if NOT yet collected", () => {
			// Fake state: Reward NOT collected
			fakeGameState.questState.setIsRewardCollected(false);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(fakeGameState.questState.hasCollectedItem.get()).toBe(true);
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});

		it("should advance chapter if reward IS collected AND has next chapter", () => {
			// Fake state: Reward COLLECTED
			fakeGameState.questState.setIsRewardCollected(true);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(context.commandBus.execute).toHaveBeenCalled();
			const command = context.commandBus.execute.mock.calls[0][0];
			expect(command.constructor.name).toBe("AdvanceChapterCommand");
			expect(command.questLoader).toBe(context.questLoader);
		});

		it("should mark item as collected if reward collected but NO next chapter (Fallback/Last Level)", () => {
			// Fake state: Reward COLLECTED + NO Next Chapter
			fakeGameState.questState.setIsRewardCollected(true);
			context.questController.hasNextChapter.mockReturnValue(false);

			controller.handleLevelCompleted();

			expect(fakeGameState.questState.hasCollectedItem.get()).toBe(true);
			expect(context.commandBus.execute).not.toHaveBeenCalled();
		});
	});
});
