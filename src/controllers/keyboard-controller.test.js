import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardController } from "./keyboard-controller.js";

describe("KeyboardController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {KeyboardController} */
	let controller;

	// Mock options
	/** @type {any} */
	let onMove;
	/** @type {any} */
	let onInteract;
	/** @type {any} */
	let onPause;
	let _isEnabled;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		onMove = vi.fn();
		onInteract = vi.fn();
		onPause = vi.fn();
		_isEnabled = vi.fn().mockReturnValue(true);
	});

	it("should initialize correctly", () => {
		controller = new KeyboardController(host, { speed: 3 });
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.options.speed).toBe(3);
	});

	describe("Event Listeners", () => {
		it("should add event listener on hostConnected", () => {
			const addEventListenerSpy = vi.spyOn(window, "addEventListener");
			controller = new KeyboardController(host);
			controller.hostConnected();
			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"keydown",
				expect.any(Function),
			);
			addEventListenerSpy.mockRestore();
		});

		it("should remove event listener on hostDisconnected", () => {
			const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
			controller = new KeyboardController(host);
			controller.hostConnected();
			controller.hostDisconnected();
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"keydown",
				expect.any(Function),
			);
			removeEventListenerSpy.mockRestore();
		});
	});

	describe("Pause Key (Escape)", () => {
		it("should trigger onPause when Escape is pressed", () => {
			controller = new KeyboardController(host, { onPause });
			const event = new KeyboardEvent("keydown", { code: "Escape" });
			const preventDefaultSpy = vi.spyOn(event, "preventDefault");

			controller.handleKeyDown(event);

			expect(onPause).toHaveBeenCalled();
			expect(preventDefaultSpy).toHaveBeenCalled();
		});
	});

	describe("Interaction Key (Space)", () => {
		it("should trigger onInteract when Space is pressed", () => {
			controller = new KeyboardController(host, { onInteract });
			const event = new KeyboardEvent("keydown", { code: "Space" });
			const preventDefaultSpy = vi.spyOn(event, "preventDefault");

			controller.handleKeyDown(event);

			expect(onInteract).toHaveBeenCalled();
			expect(preventDefaultSpy).toHaveBeenCalled();
		});
	});

	describe("Movement Keys", () => {
		beforeEach(() => {
			controller = new KeyboardController(host, {
				onMove,
				speed: 2.5,
			});
		});

		it("should move up with ArrowUp", () => {
			const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
			controller.handleKeyDown(event);
			expect(onMove).toHaveBeenCalledWith(0, -2.5);
		});

		it("should move down with ArrowDown", () => {
			const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
			controller.handleKeyDown(event);
			expect(onMove).toHaveBeenCalledWith(0, 2.5);
		});

		it("should move left with ArrowLeft", () => {
			const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
			controller.handleKeyDown(event);
			expect(onMove).toHaveBeenCalledWith(-2.5, 0);
		});

		it("should move right with ArrowRight", () => {
			const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
			controller.handleKeyDown(event);
			expect(onMove).toHaveBeenCalledWith(2.5, 0);
		});

		it("should move up with W key", () => {
			const event = new KeyboardEvent("keydown", { key: "w" });
			controller.handleKeyDown(event);
			expect(onMove).toHaveBeenCalledWith(0, -2.5);
		});
	});
});
