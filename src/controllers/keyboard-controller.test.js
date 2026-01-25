import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardController } from "./keyboard-controller.js";

describe("KeyboardController", () => {
	/** @type {any} */
	let host;
	/** @type {KeyboardController} */
	let controller;
	/** @type {{ keydown?: (e: any) => void }} */
	let eventMap = {};

	beforeEach(() => {
		// Mock host
		host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
			handleMove: vi.fn(),
			handleInteract: vi.fn(),
			handlePause: vi.fn(),
		};

		// Mock window event listeners
		window.addEventListener = vi.fn((event, callback) => {
			if (event === "keydown") eventMap.keydown = callback;
		});
		window.removeEventListener = vi.fn((event) => {
			if (event === "keydown") delete eventMap.keydown;
		});

		// Initialize controller
		controller = new KeyboardController(host);
		controller.hostConnected();
	});

	afterEach(() => {
		controller.hostDisconnected();
		eventMap = {};
		vi.clearAllMocks();
	});

	it("should register keydown listener on connection", () => {
		expect(window.addEventListener).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
		);
	});

	it("should call host.handleMove for arrow keys", () => {
		const event = { key: "ArrowUp", preventDefault: vi.fn() };
		eventMap.keydown?.(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(host.handleMove).toHaveBeenCalledWith(0, -2.5);
	});

	it("should call host.handleMove for WASD keys", () => {
		const event = { key: "d", preventDefault: vi.fn() };
		eventMap.keydown?.(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(host.handleMove).toHaveBeenCalledWith(2.5, 0);
	});

	it("should call host.handleInteract() on Space", () => {
		const event = { code: "Space", preventDefault: vi.fn() };
		eventMap.keydown?.(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(host.handleInteract).toHaveBeenCalled();
	});

	it("should call host.handlePause() on Escape", () => {
		const event = { code: "Escape", preventDefault: vi.fn() };
		eventMap.keydown?.(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(host.handlePause).toHaveBeenCalled();
	});

	it("should use custom speed from options", () => {
		const customController = new KeyboardController(host, {
			speed: 5.0,
		});
		customController.hostConnected();

		// WASD 'd' (Right)
		const event = { key: "d", preventDefault: vi.fn() };
		eventMap.keydown?.(event);

		expect(host.handleMove).toHaveBeenCalledWith(5.0, 0);
	});

	it("should remove event listener on disconnect", () => {
		controller.hostDisconnected();
		expect(window.removeEventListener).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
		);
	});
});
