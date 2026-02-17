import { Signal } from "@lit-labs/signals";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loggerContext } from "../contexts/logger-context.js";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { gameStoreContext } from "../state/game-store.js";
import { GameController } from "./game-controller.js";

// Mock @lit/context to handle dependency injection in tests
const contextMocks = new Map();
vi.mock("@lit/context", () => {
	class MockContextConsumer {
		/**
		 * @param {any} host
		 * @param {any} options
		 */
		constructor(host, options) {
			this.host = host;
			this.options = options;
			// Store callback to trigger it manually
			contextMocks.set(options.context, options.callback);
		}
	}
	return {
		ContextConsumer: MockContextConsumer,
		createContext: vi.fn((key) => key),
	};
});

describe("GameController", () => {
	/** @type {any} */
	let host;
	/** @type {GameController} */
	let controller;

	// Mock services
	/** @type {any} */
	let mockLogger;
	/** @type {any} */
	let mockGameStore;
	/** @type {any} */
	let mockQuestController;

	beforeEach(() => {
		vi.clearAllMocks();
		contextMocks.clear();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		};

		mockGameStore = {
			hero: {
				pos: new Signal.State({ x: 50, y: 15 }),
			},
		};

		mockQuestController = {
			hasNextChapter: vi.fn(),
			isLastChapter: vi.fn(),
			currentQuest: { id: "test-quest" },
			currentChapter: { id: "c1" }, // Default no exit zone
			advanceChapter: vi.fn().mockResolvedValue(undefined),
			completeChapter: vi.fn(),
		};

		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		// Mock window.location
		window.history.replaceState({}, "", "/");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const initController = (options = {}) => {
		controller = new GameController(host, options);

		/**
		 * Manual injection via context keys
		 * @param {import("@lit/context").Context<unknown, unknown>} context
		 * @param {unknown} mock
		 */
		const inject = (context, mock) => {
			const callback = contextMocks.get(context);
			if (callback) callback(mock);
		};

		inject(loggerContext, mockLogger);
		inject(gameStoreContext, mockGameStore);
		inject(questControllerContext, mockQuestController);
	};

	it("should not enable debug mode by default", () => {
		initController();
		controller.hostConnected();

		expect(controller.isEnabled).toBe(false);
	});

	it("should enable debug mode when ?debug is in URL", () => {
		window.history.replaceState({}, "", "/?debug");
		initController();
		controller.hostConnected();

		expect(controller.isEnabled).toBe(true);
	});

	it("should log instructions on enable", () => {
		window.history.replaceState({}, "", "/?debug");
		initController();
		controller.hostConnected();

		expect(mockLogger.info).toHaveBeenCalledWith(
			expect.stringContaining("DEBUG MODE ENABLED"),
		);
	});

	it("should handle exit zone reached by executing questController.advanceChapter", () => {
		initController();
		controller.hostConnected();

		controller.handleExitZoneReached();

		expect(mockQuestController.advanceChapter).toHaveBeenCalled();
	});

	describe("handleLevelCompleted", () => {
		beforeEach(() => {
			initController();
			controller.hostConnected();
		});

		it("should delegate to questController.completeChapter()", () => {
			controller.handleLevelCompleted();
			expect(mockQuestController.completeChapter).toHaveBeenCalled();
		});
	});
});
