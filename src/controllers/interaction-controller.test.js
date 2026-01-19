import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionController } from "./interaction-controller.js";

describe("InteractionController", () => {
	/** @type {any} */
	let host;
	/** @type {InteractionController} */
	let controller;

	// Mock options
	/** @type {any} */
	let getState;
	/** @type {any} */
	let getNpcPosition;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			dispatchEvent: vi.fn(), // Mock dispatchEvent
			updateComplete: Promise.resolve(true),
		};

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
		controller = new InteractionController(host, {
			interactionDistance: 20,
			interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
		});
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.options.interactionDistance).toBe(20);
	});

	describe("Distance Calculation", () => {
		it("should calculate distance correctly", () => {
			controller = new InteractionController(host, {
				interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
			});
			const dist = controller.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
			expect(dist).toBe(5); // 3-4-5 triangle
		});

		it("should return Infinity if target is missing", () => {
			controller = new InteractionController(host, {
				interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
			});
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
				interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
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
				interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
			});
			expect(controller.isCloseToNpc()).toBe(false);
		});
	});

	describe("Interaction Logic", () => {
		it("should dispatch request-dialog event if close and item NOT collected", () => {
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				interactWithNpcUseCase: /** @type {any} */ ({
					execute: vi.fn().mockReturnValue({ action: "showDialog" }),
				}),
			});

			controller.handleInteract();
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "request-dialog",
				}),
			);
		});

		it("should NOT dispatch event if item already collected", () => {
			getState.mockReturnValue({
				heroPos: { x: 0, y: 0 },
				hasCollectedItem: true,
			});
			controller = new InteractionController(host, {
				getState,
				getNpcPosition,
				interactWithNpcUseCase: /** @type {any} */ ({
					execute: vi.fn().mockReturnValue({ action: "none" }),
				}),
			});

			controller.handleInteract();
			expect(host.dispatchEvent).not.toHaveBeenCalled();
		});

		describe("Final Boss Logic", () => {
			beforeEach(() => {
				controller = new InteractionController(host, {
					getState,
					getNpcPosition,
					interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
				});
			});

			it("should dispatch show-locked-message event if API is LEGACY", () => {
				getState.mockReturnValue({
					heroPos: { x: 0, y: 0 },
					hotSwitchState: "legacy",
					chapterData: {
						npc: {
							requirements: {
								hotSwitchState: { value: "new", message: "REQ: NEW API" },
							},
						},
					}, // Important flag
				});

				controller = new InteractionController(host, {
					getState,
					getNpcPosition,
					interactWithNpcUseCase: /** @type {any} */ ({
						execute: vi.fn().mockReturnValue({
							action: "showLocked",
							message: "REQ: NEW API",
						}),
					}),
				});

				controller.handleInteract();

				expect(host.dispatchEvent).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "show-locked-message",
						detail: { message: "REQ: NEW API" },
					}),
				);
			});

			it("should dispatch request-dialog event if API is NEW", () => {
				getState.mockReturnValue({
					heroPos: { x: 0, y: 0 },
					hotSwitchState: "new",
					chapterData: {
						npc: {
							requirements: {
								hotSwitchState: { value: "new", message: "REQ: NEW API" },
							},
						},
					},
				});

				controller = new InteractionController(host, {
					getState,
					getNpcPosition,
					interactWithNpcUseCase: /** @type {any} */ ({
						execute: vi.fn().mockReturnValue({ action: "showDialog" }),
					}),
				});

				controller.handleInteract();

				expect(host.dispatchEvent).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "request-dialog",
					}),
				);
			});
		});
	});

	describe("Lifecycle & Robustness", () => {
		it("should handle lifecycle methods without error", () => {
			// Even if empty, ensure they exist and don't throw
			expect(() => controller.hostConnected()).not.toThrow();
			expect(() => controller.hostDisconnected()).not.toThrow();
		});

		it("should gracefully handle missing state during interaction", () => {
			// Mock getState returning null/undefined
			controller = new InteractionController(host, {
				getState: () => /** @type {any} */ (null),
				interactWithNpcUseCase: /** @type {any} */ ({ execute: vi.fn() }),
			});
			expect(() => controller.handleInteract()).not.toThrow();
		});
	});
});
