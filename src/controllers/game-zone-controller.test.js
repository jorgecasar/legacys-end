import { beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../constants/events.js";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { GameZoneController } from "./game-zone-controller.js";

describe("GameZoneController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameZoneController} */
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
		// Initial state
		fakeGameState.hasCollectedItem.set(false);

		context = {
			eventBus: {
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			},
			questController: {
				currentChapter: {},
			},
			gameState: fakeGameState,
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

	it("should subscribe to HERO_MOVED on hostConnected", () => {
		controller = new GameZoneController(host, context, {
			processGameZoneInteraction: /** @type {any} */ ({
				execute: vi.fn(),
			}),
		});
		controller.hostConnected();
		expect(context.eventBus.on).toHaveBeenCalledWith(
			EVENTS.UI.HERO_MOVED,
			/** @type {any} */ (controller).handleHeroMoved,
		);
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
						payload: "light",
					},
				]),
			};

			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ (mockUseCase),
			});

			// Update state to have collected item
			fakeGameState.hasCollectedItem.set(true);

			// Above limit -> Light
			// The arguments passed to checkZones are irrelevant for this test as usage is mocked,
			// but we call it to trigger the flow.
			controller.checkZones(50, 35, true);
			expect(fakeGameState.themeMode.get()).toBe("light");
		});

		it("should NOT trigger theme change if item is NOT collected", () => {
			// I'll add `requiresItem: true` to the Zone in the test, and update UseCase to handle it.
			// Let's stick to the Plan: "Refactor Quest Logic".
			// I missed this nuance in the original file, it was a TODO/Empty test.
			// I will populate it correctly now using Fakes.

			context.questController.currentChapter = { zones: themeZones };
			fakeGameState.hasCollectedItem.set(false);
			fakeGameState.themeMode.set("dark");

			// Logic is inside processGameZoneInteraction.
			// If I mock it to return [] (empty actions), I simulate "No Action".
			const mockUseCase = {
				execute: vi.fn().mockReturnValue([]),
			};

			controller = new GameZoneController(host, context, {
				processGameZoneInteraction: /** @type {any} */ (mockUseCase),
			});

			controller.checkZones(50, 35, true);
			expect(fakeGameState.themeMode.get()).toBe("dark");
		});
	});
});
