import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { gameStoreContext } from "../core/store.js";
import { CollisionController } from "./collision-controller.js";

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

describe("CollisionController", () => {
	/** @type {any} */
	let host;
	/** @type {CollisionController} */
	let controller;

	/** @type {any} */
	let mockGameStore;
	/** @type {any} */
	let mockQuestController;

	/** @type {Signal.State<{x: number, y: number}>} */
	let heroPos;
	/** @type {Signal.State<boolean>} */
	let hasCollectedItem;

	beforeEach(() => {
		vi.clearAllMocks();
		contextMocks.clear();

		heroPos = new Signal.State({ x: 50, y: 50 });
		hasCollectedItem = new Signal.State(true);

		mockGameStore = {
			hero: {
				pos: heroPos,
			},
			quest: {
				hasCollectedItem: hasCollectedItem,
			},
		};

		mockQuestController = {
			currentChapter: {
				exitZone: { x: 50, y: 50, width: 10, height: 10 },
			},
		};

		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
	});

	const initController = (options = {}) => {
		controller = new CollisionController(host, options);

		// Manual injection
		/**
		 * @param {import("@lit/context").Context<unknown, unknown>} context
		 * @param {unknown} mock
		 */
		const inject = (context, mock) => {
			const callback = contextMocks.get(context);
			if (callback) callback(mock);
		};

		inject(gameStoreContext, mockGameStore);
		inject(questControllerContext, mockQuestController);
	};

	it("should initialize correctly", () => {
		initController({ heroSize: 2.5 });
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.options.heroSize).toBe(2.5);
	});

	it("should check exit zone on hostUpdate", () => {
		initController();
		const spy = vi.spyOn(controller, "checkExitZone");

		// Set initial state
		heroPos.set({ x: 50, y: 50 });
		hasCollectedItem.set(true);

		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(
			50,
			50,
			mockQuestController.currentChapter.exitZone,
			true,
		);

		// Update signal and call hostUpdate again
		spy.mockClear();
		heroPos.set({ x: 52, y: 52 });
		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(
			52,
			52,
			mockQuestController.currentChapter.exitZone,
			true,
		);
	});

	describe("checkAABB", () => {
		it("should detect overlapping boxes", () => {
			initController();
			const box1 = { x: 10, y: 10, width: 10, height: 10 };
			const box2 = { x: 12, y: 12, width: 10, height: 10 };

			expect(controller.checkAABB(box1, box2)).toBe(true);
		});

		it("should not detect separated boxes", () => {
			initController();
			const box1 = { x: 10, y: 10, width: 10, height: 10 };
			const box2 = { x: 30, y: 30, width: 10, height: 10 };

			expect(controller.checkAABB(box1, box2)).toBe(false);
		});

		it("should not detect touching boxes (strict inequality)", () => {
			initController();
			// Box 1: x=5-15 (center 10, width 10)
			// Box 2: x=15-25 (center 20, width 10)
			const box1 = { x: 10, y: 10, width: 10, height: 10 };
			const box2 = { x: 20, y: 10, width: 10, height: 10 };

			expect(controller.checkAABB(box1, box2)).toBe(false);
		});
	});

	describe("checkExitZone", () => {
		const exitZone = { x: 50, y: 50, width: 10, height: 10 };

		it("should return false if item is not collected", () => {
			initController();
			expect(controller.checkExitZone(50, 50, exitZone, false)).toBe(false);
			expect(/** @type {any} */ (host).gameController).toBeUndefined();
		});

		it("should return false if exitZone is null", () => {
			initController();
			expect(
				controller.checkExitZone(50, 50, /** @type {any} */ (null), true),
			).toBe(false);
		});

		it("should detect collision when item is collected and overlapping", () => {
			initController();
			// Mock gameController
			/** @type {any} */ (host).gameController = {
				handleExitZoneReached: vi.fn(),
			};

			// Hero at 50,50 overlaps with exit at 50,50
			const result = controller.checkExitZone(50, 50, exitZone, true);

			expect(result).toBe(true);
			expect(
				/** @type {any} */ (host).gameController.handleExitZoneReached,
			).toHaveBeenCalled();
		});

		it("should not detect collision if strictly outside", () => {
			initController();
			/** @type {any} */ (host).gameController = {
				handleExitZoneReached: vi.fn(),
			};

			// Hero at 70,70 is far from exit at 50,50
			const result = controller.checkExitZone(70, 70, exitZone, true);

			expect(result).toBe(false);
			expect(
				/** @type {any} */ (host).gameController.handleExitZoneReached,
			).not.toHaveBeenCalled();
		});
	});
});
