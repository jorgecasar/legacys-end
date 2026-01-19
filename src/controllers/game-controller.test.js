import { Signal } from "@lit-labs/signals";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameController } from "./game-controller.js";

describe("GameController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameController} */
	let controller;
	/** @type {any} */
	let context;
	/** @type {any} */
	let heroState;
	/** @type {any} */
	let questState;
	/** @type {any} */
	let worldState;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		heroState = {
			pos: new Signal.State({ x: 50, y: 15 }),
		};

		questState = {
			hasCollectedItem: new Signal.State(false),
			isRewardCollected: new Signal.State(false),
			setIsRewardCollected: (/** @type {boolean} */ val) =>
				questState.isRewardCollected.set(val),
			setHasCollectedItem: (/** @type {boolean} */ val) =>
				questState.hasCollectedItem.set(val),
		};

		worldState = {
			isPaused: new Signal.State(false),
			setShowDialog: vi.fn(),
		};

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			heroState,
			questState,
			worldState,
			questController: {
				hasNextChapter: vi.fn(),
				isLastChapter: vi.fn(),
			},
			questLoader: {
				completeQuest: vi.fn(),
				completeChapter: vi.fn(),
				advanceQuest: vi.fn(),
				advanceChapter: vi.fn().mockResolvedValue(undefined),
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

	it("should handle exit zone reached by executing questLoader.advanceChapter", () => {
		controller = new GameController(host, { ...context });
		controller.hostConnected();

		controller.handleExitZoneReached();

		expect(context.questLoader.advanceChapter).toHaveBeenCalled();
	});

	describe("handleLevelCompleted", () => {
		beforeEach(() => {
			controller = new GameController(host, { ...context });
			controller.hostConnected();
		});

		it("should mark item as collected if NOT yet collected", () => {
			// Fake state: Reward NOT collected
			questState.setIsRewardCollected(false);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(questState.hasCollectedItem.get()).toBe(true);
			expect(context.questLoader.advanceChapter).not.toHaveBeenCalled();
		});

		it("should advance chapter if reward IS collected AND has next chapter", () => {
			// Fake state: Reward COLLECTED
			questState.setIsRewardCollected(true);
			context.questController.hasNextChapter.mockReturnValue(true);

			controller.handleLevelCompleted();

			expect(context.questLoader.advanceChapter).toHaveBeenCalled();
		});

		it("should mark item as collected if reward collected but NO next chapter (Fallback/Last Level)", () => {
			// Fake state: Reward COLLECTED + NO Next Chapter
			questState.setIsRewardCollected(true);
			context.questController.hasNextChapter.mockReturnValue(false);

			controller.handleLevelCompleted();

			expect(questState.hasCollectedItem.get()).toBe(true);
			expect(context.questLoader.advanceChapter).not.toHaveBeenCalled();
		});
	});
});
