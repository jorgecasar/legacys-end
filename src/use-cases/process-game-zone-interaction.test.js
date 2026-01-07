import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../constants/game-config.js";
import { ProcessGameZoneInteractionUseCase } from "./process-game-zone-interaction.js";

describe("ProcessGameZoneInteractionUseCase", () => {
	const useCase = new ProcessGameZoneInteractionUseCase();

	describe("Theme Zones", () => {
		const chapter = /** @type {any} */ ({ hasThemeZones: true });

		it("should return dark theme when in dark zone", () => {
			const y = GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT - 10;
			const results = useCase.execute({
				x: 50,
				y,
				chapter,
				hasCollectedItem: true,
			});
			expect(results).toContainEqual({ type: "THEME_CHANGE", payload: "dark" });
		});

		it("should return light theme when in light zone", () => {
			const y = GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT + 10;
			const results = useCase.execute({
				x: 50,
				y,
				chapter,
				hasCollectedItem: true,
			});
			expect(results).toContainEqual({
				type: "THEME_CHANGE",
				payload: "light",
			});
		});

		it("should not change theme if item not collected", () => {
			const results = useCase.execute({
				x: 50,
				y: 0,
				chapter,
				hasCollectedItem: false,
			});
			expect(results).toHaveLength(0);
		});
	});

	describe("Context Zones", () => {
		const chapter = /** @type {any} */ ({ hasHotSwitch: true });

		it("should detect legacy zone", () => {
			const results = useCase.execute({
				x: 75,
				y: 50,
				chapter,
				hasCollectedItem: false,
			});
			expect(results).toContainEqual({
				type: "CONTEXT_CHANGE",
				payload: "legacy",
			});
		});

		it("should detect new zone", () => {
			const results = useCase.execute({
				x: 25,
				y: 50,
				chapter,
				hasCollectedItem: false,
			});
			expect(results).toContainEqual({
				type: "CONTEXT_CHANGE",
				payload: "new",
			});
		});

		it("should return null payload in neutral zone", () => {
			const results = useCase.execute({
				x: 50,
				y: 10,
				chapter,
				hasCollectedItem: false,
			});
			expect(results).toContainEqual({
				type: "CONTEXT_CHANGE",
				payload: null,
			});
		});
	});
});
