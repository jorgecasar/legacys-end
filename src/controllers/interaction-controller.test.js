import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionController } from "./interaction-controller.js";

describe("InteractionController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {InteractionController} */
	let controller;

	// Mock options
	/** @type {any} */
	let onShowDialog;
	let _onVictory;
	/** @type {any} */
	let onLocked;
	/** @type {any} */
	let getState;
	/** @type {any} */
	let getNpcPosition;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		onShowDialog = vi.fn();
		_onVictory = vi.fn();
		onLocked = vi.fn();
		getState = vi.fn();
		getNpcPosition = vi.fn();

		// Default state
		getState.mockReturnValue({
			level: "chapter-1",
			heroPos: { x: 0, y: 0 },
			hotSwitchState: null,
			hasCollectedItem: false,
		});
		getNpcPosition.mockReturnValue({ x: 10, y: 0 }); // Distance 10
	});

	it("should initialize correctly", () => {
		controller = new InteractionController(host, { interactionDistance: 20 });
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.options.interactionDistance).toBe(20);
	});

	describe("Distance Calculation", () => {
		it("should calculate distance correctly", () => {
			controller = new InteractionController(host);
			const dist = controller.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
			expect(dist).toBe(5); // 3-4-5 triangle
		});

		it("should return Infinity if target is missing", () => {
			controller = new InteractionController(host);
			expect(
				controller.calculateDistance({ x: 0, y: 0 }, /** @type {any} */ (null)),
			).toBe(Infinity);
		});
	});

	describe("Proximity Detection", () => {
		it("should detect when close to NPC", () => {
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				interactionDistance: 15,
			});
			// Distance is 10 (setup), limit is 15 -> True
			expect(controller.isCloseToNpc()).toBe(true);
		});

		it("should detect when far from NPC", () => {
			getNpcPosition.mockReturnValue({ x: 20, y: 0 }); // Distance 20
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				interactionDistance: 15,
			});
			expect(controller.isCloseToNpc()).toBe(false);
		});
	});

	describe("Interaction Logic", () => {
		it("should show dialog if close and item NOT collected", () => {
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				onShowDialog,
			});

			controller.handleInteract();
			expect(onShowDialog).toHaveBeenCalled();
		});

		it("should NOT show dialog if item already collected", () => {
			getState.mockReturnValue({
				heroPos: { x: 0, y: 0 },
				hasCollectedItem: true,
			});
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				onShowDialog,
			});

			controller.handleInteract();
			expect(onShowDialog).not.toHaveBeenCalled();
		});

		describe("Final Boss Logic", () => {
			beforeEach(() => {
				controller = new InteractionController(host, {
					getState,
					getNpcPosition,
					onShowDialog,
					onLocked,
				});
			});

			it("should BLOCK interaction if API is LEGACY", () => {
				getState.mockReturnValue({
					heroPos: { x: 0, y: 0 },
					hotSwitchState: null,
					chapterData: { isFinalBoss: true }, // Important flag
				});

				controller.handleInteract();

				expect(onShowDialog).not.toHaveBeenCalled();
				expect(onLocked).toHaveBeenCalledWith("REQ: NEW API");
			});

			it("should ALLOW interaction if API is NEW", () => {
				getState.mockReturnValue({
					heroPos: { x: 0, y: 0 },
					hotSwitchState: "new",
					chapterData: { isFinalBoss: true },
				});

				controller.handleInteract();

				expect(onShowDialog).toHaveBeenCalled();
				expect(onLocked).not.toHaveBeenCalled();
			});
		});
	});
});
