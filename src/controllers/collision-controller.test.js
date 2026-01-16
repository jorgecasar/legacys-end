import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { CollisionController } from "./collision-controller.js";

describe("CollisionController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {CollisionController} */
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
		fakeGameState.heroPos.set({ x: 50, y: 50 });
		fakeGameState.hasCollectedItem.set(true);

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			questController: {
				currentChapter: {
					exitZone: { x: 50, y: 50, width: 10, height: 10 },
				},
			},
			gameState: fakeGameState,
			heroState: {
				pos: fakeGameState.heroPos,
			},
			questState: {
				hasCollectedItem: fakeGameState.hasCollectedItem,
			},
		};

		controller = new CollisionController(host, context, {
			heroSize: 2.5,
		});
	});

	it("should check exit zone on hostUpdate", () => {
		const spy = vi.spyOn(controller, "checkExitZone");

		// Set initial state
		fakeGameState.heroPos.set({ x: 50, y: 50 });
		fakeGameState.hasCollectedItem.set(true);

		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(
			50,
			50,
			context.questController.currentChapter.exitZone,
			true,
		);

		// Update signal and call hostUpdate again
		spy.mockClear();
		fakeGameState.heroPos.set({ x: 52, y: 52 });
		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(
			52,
			52,
			context.questController.currentChapter.exitZone,
			true,
		);
	});

	describe("checkAABB", () => {
		it("should detect overlapping boxes", () => {
			const box1 = { x: 10, y: 10, width: 10, height: 10 };
			const box2 = { x: 12, y: 12, width: 10, height: 10 };

			expect(controller.checkAABB(box1, box2)).toBe(true);
		});

		it("should not detect separated boxes", () => {
			const box1 = { x: 10, y: 10, width: 10, height: 10 };
			const box2 = { x: 30, y: 30, width: 10, height: 10 };

			expect(controller.checkAABB(box1, box2)).toBe(false);
		});

		it("should not detect touching boxes (strict inequality)", () => {
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
			expect(controller.checkExitZone(50, 50, exitZone, false)).toBe(false);
			expect(/** @type {any} */ (host).gameController).toBeUndefined();
		});

		it("should return false if exitZone is null", () => {
			expect(
				controller.checkExitZone(50, 50, /** @type {any} */ (null), true),
			).toBe(false);
		});

		it("should detect collision when item is collected and overlapping", () => {
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
