import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_CONFIG } from "../constants/game-config.js";
import { GameZoneController } from "./game-zone-controller.js";

describe("GameZoneController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {GameZoneController} */
	let controller;

	// Mocks
	/** @type {any} */
	let onThemeChange;
	/** @type {any} */
	let onContextChange;
	/** @type {any} */
	let getChapterData;
	/** @type {any} */
	let hasCollectedItem;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
		onThemeChange = vi.fn();
		onContextChange = vi.fn();
		getChapterData = vi.fn();
		hasCollectedItem = vi.fn();
	});

	it("should initialize correctly", () => {
		controller = new GameZoneController(host);
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("Theme Zones", () => {
		it("should trigger theme change when item is collected and zones are active", () => {
			getChapterData.mockReturnValue({ hasThemeZones: true });
			hasCollectedItem.mockReturnValue(true);

			controller = new GameZoneController(host, {
				getChapterData,
				hasCollectedItem,
				onThemeChange,
			});

			// Above limit -> Light
			controller.checkZones(
				50,
				GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT + 10,
			);
			expect(onThemeChange).toHaveBeenCalledWith("light");

			// Below limit -> Dark
			controller.checkZones(
				50,
				GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT - 10,
			);
			expect(onThemeChange).toHaveBeenCalledWith("dark");
		});

		it("should NOT trigger theme change if item is NOT collected", () => {
			getChapterData.mockReturnValue({ hasThemeZones: true });
			hasCollectedItem.mockReturnValue(false);

			controller = new GameZoneController(host, {
				getChapterData,
				hasCollectedItem,
				onThemeChange,
			});

			controller.checkZones(50, 10); // Should be dark
			expect(onThemeChange).not.toHaveBeenCalled();
		});

		it("should NOT trigger theme change if chapter has no zones", () => {
			getChapterData.mockReturnValue({ hasThemeZones: false });
			hasCollectedItem.mockReturnValue(true);

			controller = new GameZoneController(host, {
				getChapterData,
				hasCollectedItem,
				onThemeChange,
			});

			controller.checkZones(50, 10);
			expect(onThemeChange).not.toHaveBeenCalled();
		});
	});

	describe("Context Zones (Hot Switch)", () => {
		beforeEach(() => {
			getChapterData.mockReturnValue({ hasHotSwitch: true });
			controller = new GameZoneController(host, {
				getChapterData,
				onContextChange,
			});
		});

		it("should detect legacy zone", () => {
			// Legacy Zone: x[50-100], y[40-100]
			controller.checkZones(75, 75);
			expect(onContextChange).toHaveBeenCalledWith("legacy");
		});

		it("should detect new zone", () => {
			// New Zone: x[0-50), y[40-100]
			controller.checkZones(25, 75);
			expect(onContextChange).toHaveBeenCalledWith("new");
		});

		it("should detect neutral zone", () => {
			// Neutral: y < 40
			controller.checkZones(50, 10);
			expect(onContextChange).toHaveBeenCalledWith(null);
		});
	});
});
