import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { themeContext } from "../contexts/theme-context.js";
import { HotSwitchStates, ZoneTypes } from "../core/constants.js";
import { gameStoreContext } from "../state/game-store.js";
import { GameZoneController } from "./game-zone-controller.js";

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

describe("GameZoneController", () => {
	/** @type {any} */
	let host;
	/** @type {GameZoneController} */
	let controller;

	// Mock services
	/** @type {any} */
	let mockGameStore;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockThemeService;

	/** @type {Signal.State<{x: number, y: number}>} */
	let heroPos;
	/** @type {Signal.State<boolean>} */
	let hasCollectedItem;

	beforeEach(() => {
		vi.clearAllMocks();
		contextMocks.clear();

		heroPos = new Signal.State({ x: 50, y: 50 });
		hasCollectedItem = new Signal.State(false);

		mockGameStore = {
			hero: {
				pos: heroPos,
				hotSwitchState: new Signal.State(HotSwitchStates.LEGACY),
				setHotSwitchState: vi.fn(),
			},
			quest: {
				hasCollectedItem: hasCollectedItem,
			},
		};

		mockQuestController = {
			currentChapter: {},
		};

		mockThemeService = {
			themeMode: {
				get: vi.fn().mockReturnValue("light"),
				set: vi.fn(),
			},
			setTheme: vi.fn(),
		};

		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
	});

	const initController = (useCases = {}) => {
		controller = new GameZoneController(host, {
			processGameZoneInteraction: /** @type {any} */ ({
				execute: vi.fn().mockReturnValue([]),
			}),
			...useCases,
		});

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
		inject(themeContext, mockThemeService);
	};

	it("should initialize correctly", () => {
		initController();
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	it("should check zones on hostUpdate", () => {
		const mockUseCase = {
			execute: vi.fn().mockReturnValue([]),
		};
		initController({ processGameZoneInteraction: mockUseCase });

		const spy = vi.spyOn(controller, "checkZones");

		// Initial state
		heroPos.set({ x: 50, y: 50 });
		controller.hostUpdate();

		// Initial check
		expect(spy).toHaveBeenCalled();

		// Update position
		spy.mockClear();
		heroPos.set({ x: 55, y: 55 });
		controller.hostUpdate();

		expect(spy).toHaveBeenCalledWith(55, 55, false);
	});

	describe("Theme Zones", () => {
		const themeZones = [
			{
				x: 0,
				y: 25,
				width: 100,
				height: 75,
				type: ZoneTypes.THEME_CHANGE,
				payload: "light",
				requiresItem: true,
			},
			{
				x: 0,
				y: 0,
				width: 100,
				height: 25,
				type: ZoneTypes.THEME_CHANGE,
				payload: "dark",
				requiresItem: true,
			},
		];

		it("should trigger theme change when item is collected and in zone", () => {
			mockQuestController.currentChapter = { zones: themeZones };

			// Mock the use case to return the theme change result requested
			const mockUseCase = {
				execute: vi.fn().mockReturnValue([
					{
						type: ZoneTypes.THEME_CHANGE,
						payload: "dark",
					},
				]),
			};

			initController({ processGameZoneInteraction: mockUseCase });

			// Update state to have collected item
			hasCollectedItem.set(true);
			mockThemeService.themeMode.get.mockReturnValue("light");

			// Trigger check
			controller.checkZones(50, 35, true);
			expect(mockThemeService.setTheme).toHaveBeenCalledWith("dark");
		});

		it("should propagate theme change to service even if same (service handles optimization)", () => {
			mockQuestController.currentChapter = { zones: themeZones };
			// Mock UseCase returning same theme
			const mockUseCase = {
				execute: vi.fn().mockReturnValue([
					{
						type: ZoneTypes.THEME_CHANGE,
						payload: "light",
					},
				]),
			};

			initController({ processGameZoneInteraction: mockUseCase });

			mockThemeService.themeMode.get.mockReturnValue("light");

			controller.checkZones(50, 35, true);
			expect(mockThemeService.setTheme).toHaveBeenCalledWith("light");
		});
	});

	describe("Regressions & Optimizations", () => {
		it("should skip processing if position has not changed", () => {
			const processSpy = vi.fn().mockReturnValue([]);
			initController({ processGameZoneInteraction: { execute: processSpy } });

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
				{ type: ZoneTypes.CONTEXT_CHANGE, payload: HotSwitchStates.LEGACY },
				{ type: ZoneTypes.CONTEXT_CHANGE, payload: HotSwitchStates.NEW },
			]);

			initController({ processGameZoneInteraction: { execute: processSpy } });

			heroPos.set({ x: 50, y: 50 });
			controller.hostUpdate();

			expect(mockGameStore.hero.setHotSwitchState).toHaveBeenCalledWith(
				HotSwitchStates.NEW,
			);
			expect(mockGameStore.hero.setHotSwitchState).toHaveBeenCalledTimes(1);
		});
	});
});
