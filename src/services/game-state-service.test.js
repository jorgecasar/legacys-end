import { beforeEach, describe, expect, it, vi } from "vitest";
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

	it("should update state with setState", () => {
		service.setState({ hasCollectedItem: true });

		const state = service.getState();
		expect(state.hasCollectedItem).toBe(true);
		// Other properties should remain unchanged
		expect(state.isPaused).toBe(false);
	});

	it("should notify listeners on state change", () => {
		const listener = vi.fn();
		service.subscribe(listener);

		service.setState({ isPaused: true });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(
			expect.objectContaining({ isPaused: true }), // New state
			expect.objectContaining({ isPaused: false }), // Old state
		);
	});

	it("should unsubscribe listener", () => {
		const listener = vi.fn();
		const unsubscribe = service.subscribe(listener);

		service.setState({ isPaused: true });
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();

		service.setState({ isPaused: false });
		expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
	});

	it("should handle multiple listeners", () => {
		const listenerA = vi.fn();
		const listenerB = vi.fn();

		service.subscribe(listenerA);
		service.subscribe(listenerB);

		service.setState({ themeMode: "dark" });

		expect(listenerA).toHaveBeenCalled();
		expect(listenerB).toHaveBeenCalled();
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
