import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameZoneController } from "./game-zone-controller.js";

describe("GameZoneController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameZoneController} */
	let controller;
	/** @type {any} */
	let context;
	/** @type {Signal.State<{x: number, y: number}>} */
	let heroPos;
	/** @type {Signal.State<boolean>} */
	let hasCollectedItem;
	/** @type {any} */
	let mockThemeService;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		heroPos = new Signal.State({ x: 50, y: 50 });
		hasCollectedItem = new Signal.State(false);

		mockThemeService = {
			themeMode: {
				get: vi.fn().mockReturnValue("light"),
				set: vi.fn(),
			},
			setTheme: vi.fn(),
		};

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			questController: {
				currentChapter: {},
			},
			themeService: mockThemeService,
			heroState: {
				pos: heroPos,
				hotSwitchState: new Signal.State("legacy"),
				setHotSwitchState: vi.fn(),
			},
			questState: {
				hasCollectedItem: hasCollectedItem,
			},
		};
	});

	it("should initialize correctly", () => {
		controller = new GameZoneController(host, context, {
			processGameZoneInteraction: /** @type {any} */ ({
				execute: vi.fn(),
			}),
		});
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	it("should check zones on hostUpdate", () => {
		controller = new GameZoneController(host, context, {
			processGameZoneInteraction: /** @type {any} */ ({
				execute: vi.fn().mockReturnValue([]),
			}),
		});

		const spy = vi.spyOn(controller, "checkZones");

		// Initial state
		heroPos.set({ x: 50, y: 50 });
		controller.hostConnected();
		controller.hostUpdate();

		// Initial check
		expect(spy).toHaveBeenCalled();

		// Update position
		spy.mockClear();
		heroPos.set({ x: 55, y: 55 });
		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(55, 55, false);

		controller.hostDisconnected();
	});

	describe("Theme Zones", () => {
		const themeZones = [
			{
				x: 0,
				y: 25,
				width: 100,
				height: 75,
				type: "THEME_CHANGE",
				payload: "light",
				requiresItem: true,
			},
			{
				x: 0,
				y: 0,
				width: 100,
				height: 25,
				type: "THEME_CHANGE",
				payload: "dark",
				requiresItem: true,
			},
		];

		it("should trigger theme change when item is collected and in zone", () => {
			context.questController.currentChapter = { zones: themeZones };

			// Mock the use case to return the theme change result requested
			const mockUseCase = {
				execute: vi.fn().mockReturnValue([
					{
						type: "THEME_CHANGE",
						payload: "dark",
					},
				]),
			};

			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ (mockUseCase),
			});

			// Update state to have collected item
			hasCollectedItem.set(true);
			mockThemeService.themeMode.get.mockReturnValue("light");

			// Trigger check
			controller.checkZones(50, 35, true);
			expect(mockThemeService.setTheme).toHaveBeenCalledWith("dark");
		});

		it("should propagate theme change to service even if same (service handles optimization)", () => {
			context.questController.currentChapter = { zones: themeZones };
			// Mock UseCase returning same theme
			const mockUseCase = {
				execute: vi.fn().mockReturnValue([
					{
						type: "THEME_CHANGE",
						payload: "light",
					},
				]),
			};

			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ (mockUseCase),
			});

			mockThemeService.themeMode.get.mockReturnValue("light");

			controller.checkZones(50, 35, true);
			expect(mockThemeService.setTheme).toHaveBeenCalledWith("light");
		});
	});

	describe("Regressions & Optimizations", () => {
		it("should skip processing if position has not changed", () => {
			const processSpy = vi.fn().mockReturnValue([]);
			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ ({
					execute: processSpy,
				}),
			});

			heroPos.set({ x: 10, y: 10 });
			controller.hostUpdate();
			expect(processSpy).toHaveBeenCalledTimes(1);

			// Call update again with same position
			controller.hostUpdate();
			expect(processSpy).toHaveBeenCalledTimes(1);

			// Change position
			heroPos.set({ x: 20, y: 20 });
			controller.hostUpdate();
			expect(processSpy).toHaveBeenCalledTimes(2);
		});

		it("should prioritize the last matching zone when zones overlap", () => {
			const processSpy = vi.fn().mockReturnValue([
				{ type: "CONTEXT_CHANGE", payload: "legacy" },
				{ type: "CONTEXT_CHANGE", payload: "new" },
			]);

			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ ({
					execute: processSpy,
				}),
			});

			// Ensure context uses the spy
			const spy = vi.spyOn(context.heroState, "setHotSwitchState");

			heroPos.set({ x: 50, y: 50 });
			controller.hostUpdate();

			expect(spy).toHaveBeenCalledWith("new");
			expect(spy).toHaveBeenCalledTimes(1);
		});
	});
});
