import { beforeEach, describe, expect, it } from "vitest";
import { GameStateService } from "./game-state-service.js";

describe("GameStateService", () => {
	/** @type {GameStateService} */
	let service;

	beforeEach(() => {
		service = new GameStateService();
	});

	it("should initialize with default state", () => {
		const state = service.getState();
		expect(state.heroPos).toBeDefined();
		expect(state.hasCollectedItem).toBe(false);
		expect(state.isPaused).toBe(false);
		expect(state.themeMode).toBe("light");
	});

	it("should return a copy of the state", () => {
		const state1 = service.getState();
		const state2 = service.getState();

		expect(state1).not.toBe(state2); // Different objects
		expect(state1).toEqual(state2); // Same content
	});

	describe("Convenience Methods", () => {
		it("should update hero position", () => {
			service.setHeroPosition(10, 20);
			expect(service.getState().heroPos).toEqual({ x: 10, y: 20 });
		});

		it("should update collected item status", () => {
			service.setCollectedItem(true);
			expect(service.getState().hasCollectedItem).toBe(true);
		});

		it("should update reward collected status", () => {
			service.setRewardCollected(true);
			expect(service.getState().isRewardCollected).toBe(true);
		});

		it("should update hot switch state", () => {
			service.setHotSwitchState("legacy");
			expect(service.getState().hotSwitchState).toBe("legacy");
		});

		it("should throw on invalid hot switch state", () => {
			expect(() => {
				service.setHotSwitchState(/** @type {any} */ ("invalid"));
			}).toThrow("Invalid hot switch state");
		});

		it("should update theme mode", () => {
			service.setThemeMode("dark");
			expect(service.getState().themeMode).toBe("dark");
		});

		it("should throw on invalid theme mode", () => {
			expect(() => {
				service.setThemeMode(/** @type {any} */ ("invalid"));
			}).toThrow("Invalid theme mode");
		});

		it("should throw on invalid hero position - negative x", () => {
			expect(() => {
				service.setHeroPosition(-1, 50);
			}).toThrow("Invalid hero position");
		});

		it("should throw on invalid hero position - x > 100", () => {
			expect(() => {
				service.setHeroPosition(101, 50);
			}).toThrow("Invalid hero position");
		});

		it("should throw on invalid hero position - non-number", () => {
			expect(() => {
				service.setHeroPosition(/** @type {any} */ ("50"), 50);
			}).toThrow("Invalid hero position");
		});

		it("should update paused status", () => {
			service.setPaused(true);
			expect(service.getState().isPaused).toBe(true);
		});

		it("should update evolving status", () => {
			service.setEvolving(true);
			expect(service.getState().isEvolving).toBe(true);
		});

		it("should update locked message", () => {
			service.setLockedMessage("Locked!");
			expect(service.getState().lockedMessage).toBe("Locked!");
		});

		it("should update theme mode", () => {
			service.setThemeMode("dark");
			expect(service.getState().themeMode).toBe("dark");
		});

		it("should reset chapter state correctly", () => {
			// Set some state first
			service.setCollectedItem(true);
			service.setRewardCollected(true);
			service.setLockedMessage("Error");
			service.setEvolving(true);
			service.setHeroPosition(99, 99); // Should NOT reset

			service.resetChapterState();

			const state = service.getState();
			expect(state.hasCollectedItem).toBe(false);
			expect(state.isRewardCollected).toBe(false);
			expect(state.lockedMessage).toBe(null);
			expect(state.isEvolving).toBe(false);
			expect(state.heroPos).toEqual({ x: 99, y: 99 }); // Persists
		});
	});
});
