import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DebugController } from "./debug-controller.js";

describe("DebugController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {DebugController} */
	let controller;
	/** @type {import("vitest").Mock} */
	let setLevel;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
		setLevel = vi.fn();

		// Mock window.location
		// Reset URL
		window.history.replaceState({}, "", "/");

		// Clean up window.game
		delete window.game;
	});

	afterEach(() => {
		delete window.game;
		vi.restoreAllMocks();
	});

	it("should not enable debug mode by default", () => {
		controller = new DebugController(host);
		controller.hostConnected();

		expect(controller.isEnabled).toBe(false);
		expect(window.game).toBeUndefined();
	});

	it("should enable debug mode when ?debug is in URL", () => {
		window.history.replaceState({}, "", "/?debug");
		controller = new DebugController(host, { setLevel });
		controller.hostConnected();

		expect(controller.isEnabled).toBe(true);
		expect(window.game).toBeDefined();
	});

	it("should expose debug commands", () => {
		window.history.replaceState({}, "", "/?debug");
		controller = new DebugController(host, { setLevel });
		controller.hostConnected();

		window.game.setChapter("chapter-1");
		expect(setLevel).toHaveBeenCalledWith("chapter-1");
	});

	it("should cleanup on hostDisconnected", () => {
		window.history.replaceState({}, "", "/?debug");
		controller = new DebugController(host);
		controller.hostConnected();

		expect(window.game).toBeDefined();

		controller.hostDisconnected();
		expect(window.game).toBeUndefined();
	});

	it("should handle missing callbacks gracefully", () => {
		window.history.replaceState({}, "", "/?debug");
		// Initialize without options
		controller = new DebugController(host);
		controller.hostConnected();

		// Should not throw
		expect(() => window.game.setChapter("test")).not.toThrow();
		expect(() => window.game.giveItem()).not.toThrow();
	});

	describe("Debug Commands", () => {
		let teleport, getState, setTheme, startQuest, completeQuest, completeChapter;
		let returnToHub, listQuests, getProgress, resetProgress;

		beforeEach(() => {
			window.history.replaceState({}, "", "/?debug");
			teleport = vi.fn();
			getState = vi.fn().mockReturnValue({ level: "chapter-1" });
			setTheme = vi.fn();
			startQuest = vi.fn();
			completeQuest = vi.fn();
			completeChapter = vi.fn();
			returnToHub = vi.fn();
			listQuests = vi.fn().mockReturnValue([]);
			getProgress = vi.fn().mockReturnValue({});
			resetProgress = vi.fn();

			controller = new DebugController(host, {
				setLevel,
				teleport,
				getState,
				setTheme,
				startQuest,
				completeQuest,
				completeChapter,
				returnToHub,
				listQuests,
				getProgress,
				resetProgress,
			});
			controller.hostConnected();
		});

		it("should expose teleport command", () => {
			window.game.teleport(100, 200);
			expect(teleport).toHaveBeenCalledWith(100, 200);
		});

		it("should expose getState command", () => {
			const consoleSpy = vi.spyOn(console, "table").mockImplementation(() => { });
			const state = window.game.getState();
			expect(getState).toHaveBeenCalled();
			expect(state).toEqual({ level: "chapter-1" });
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should expose setTheme command", () => {
			window.game.setTheme("dark");
			expect(setTheme).toHaveBeenCalledWith("dark");
		});

		it("should expose startQuest command", () => {
			window.game.startQuest("quest-1");
			expect(startQuest).toHaveBeenCalledWith("quest-1");
		});

		it("should expose completeQuest command", () => {
			window.game.completeQuest();
			expect(completeQuest).toHaveBeenCalled();
		});

		it("should expose completeChapter command", () => {
			window.game.completeChapter();
			expect(completeChapter).toHaveBeenCalled();
		});

		it("should expose returnToHub command", () => {
			window.game.returnToHub();
			expect(returnToHub).toHaveBeenCalled();
		});

		it("should expose listQuests command", () => {
			const quests = window.game.listQuests();
			expect(listQuests).toHaveBeenCalled();
			expect(quests).toEqual([]);
		});

		it("should expose getProgress command", () => {
			const progress = window.game.getProgress();
			expect(getProgress).toHaveBeenCalled();
			expect(progress).toEqual({});
		});

		it("should expose resetProgress command", () => {
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
			window.game.resetProgress();
			expect(confirmSpy).toHaveBeenCalled();
			expect(resetProgress).toHaveBeenCalled();
			confirmSpy.mockRestore();
		});

		it("should expose help command", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
			window.game.help();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
