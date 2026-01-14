import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InteractCommand } from "../commands/interact-command.js";
import { PauseGameCommand } from "../commands/pause-game-command.js";
import { GameEvents } from "../core/event-bus.js";
import { KeyboardController } from "./keyboard-controller.js";

// Mock commands
vi.mock("../commands/interact-command.js");
vi.mock("../commands/pause-game-command.js");

describe("KeyboardController", () => {
	/** @type {any} */
	let host;
	/** @type {any} */
	let context;
	/** @type {KeyboardController} */
	let controller;
	/** @type {Record<string, Function>} */
	let eventMap = {};

	beforeEach(() => {
		// Mock host
		host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
		};

		// Mock context
		context = {
			eventBus: {
				emit: vi.fn(),
			},
			commandBus: {
				execute: vi.fn(),
				undo: vi.fn(),
				redo: vi.fn(),
			},
			interaction: {},
			gameState: {},
		};

		// Mock window event listeners
		window.addEventListener = vi.fn((event, callback) => {
			eventMap[event] = callback;
		});
		window.removeEventListener = vi.fn((event) => {
			delete eventMap[event];
		});

		// Initialize controller
		// Passing context as 2nd argument (matching implementation)
		controller = new KeyboardController(host, { ...context });
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

	it("should emit HERO_MOVE_INPUT for arrow keys", () => {
		const event = { key: "ArrowUp", preventDefault: vi.fn() };
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.eventBus.emit).toHaveBeenCalledWith(
			GameEvents.HERO_MOVE_INPUT,
			{
				dx: 0,
				dy: -2.5,
			},
		);
	});

	it("should emit HERO_MOVE_INPUT for WASD keys", () => {
		const event = { key: "d", preventDefault: vi.fn() };
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.eventBus.emit).toHaveBeenCalledWith(
			GameEvents.HERO_MOVE_INPUT,
			{
				dx: 2.5,
				dy: 0,
			},
		);
	});

	it("should execute InteractCommand on Space", () => {
		const event = { code: "Space", preventDefault: vi.fn() };
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.execute).toHaveBeenCalled();
		expect(InteractCommand).toHaveBeenCalled();
	});

	it("should execute PauseGameCommand on Escape", () => {
		const event = { code: "Escape", preventDefault: vi.fn() };
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.execute).toHaveBeenCalled();
		expect(PauseGameCommand).toHaveBeenCalled();
	});

	it("should handle undo with Ctrl+Z", () => {
		const event = {
			key: "z",
			ctrlKey: true,
			toLowerCase: () => "z",
			preventDefault: vi.fn(),
		};
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.undo).toHaveBeenCalled();
	});

	it("should handle redo with Ctrl+Shift+Z", () => {
		const event = {
			key: "z",
			ctrlKey: true,
			shiftKey: true,
			toLowerCase: () => "z",
			preventDefault: vi.fn(),
		};
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.redo).toHaveBeenCalled();
	});

	it("should handle redo with Ctrl+Y", () => {
		const event = {
			key: "y",
			ctrlKey: true,
			toLowerCase: () => "y",
			preventDefault: vi.fn(),
		};
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.redo).toHaveBeenCalled();
	});

	it("should handle Mac Meta key for undo (Cmd+Z)", () => {
		const event = {
			key: "z",
			metaKey: true, // Cmd key on Mac
			toLowerCase: () => "z",
			preventDefault: vi.fn(),
		};
		eventMap.keydown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(context.commandBus.undo).toHaveBeenCalled();
	});

	it("should use custom speed from options", () => {
		const customController = new KeyboardController(host, {
			...context,
			speed: 5.0,
		});
		customController.hostConnected();

		// WASD 'd' (Right)
		const event = { key: "d", preventDefault: vi.fn() };
		eventMap.keydown(event);

		expect(context.eventBus.emit).toHaveBeenCalledWith(
			GameEvents.HERO_MOVE_INPUT,
			{
				dx: 5.0,
				dy: 0,
			},
		);
	});

	it("should remove event listener on disconnect", () => {
		controller.hostDisconnected();
		expect(window.removeEventListener).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
		);
		// Verify functionality is actually gone
		// (We manually registered callback via mock, but in real DOM it would be gone)
		// For this test we assume removeEventListener being called is sufficient
	});

	it("should be robust if services are missing (e.g., commandBus)", () => {
		// Create controller with missing commandBus
		const partialContext = {
			eventBus: context.eventBus,
			// commandBus missing
		};

		// @ts-expect-error
		const robustController = new KeyboardController(host, partialContext, {});
		robustController.hostConnected();

		const event = {
			key: "z",
			ctrlKey: true,
			toLowerCase: () => "z",
			preventDefault: vi.fn(),
		};

		// Should not throw when attempting undo
		expect(() => eventMap.keydown(event)).not.toThrow();
	});
});
