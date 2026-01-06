import { beforeEach, describe, expect, it } from "vitest";
import { GameConfiguration } from "./game-configuration.js";

describe("GameConfiguration", () => {
	describe("Environment-based configuration", () => {
		it("should load test configuration", () => {
			const config = new GameConfiguration("test");
			expect(config.env).toBe("test");
			expect(config.animation.rewardDuration).toBe(100);
			expect(config.features.voiceControl).toBe(false);
			expect(config.features.debugMode).toBe(true);
		});

		it("should load development configuration", () => {
			const config = new GameConfiguration("development");
			expect(config.env).toBe("development");
			expect(config.animation.rewardDuration).toBe(1000);
			expect(config.features.voiceControl).toBe(true);
			expect(config.features.debugMode).toBe(true);
		});

		it("should load production configuration", () => {
			const config = new GameConfiguration("production");
			expect(config.env).toBe("production");
			expect(config.animation.rewardDuration).toBe(2000);
			expect(config.features.voiceControl).toBe(true);
			expect(config.features.debugMode).toBe(false);
		});
	});

	describe("Configuration access", () => {
		/** @type {GameConfiguration} */
		let config;

		beforeEach(() => {
			config = new GameConfiguration("test");
		});

		it("should get animation config", () => {
			expect(config.animation.rewardDuration).toBe(100);
			expect(config.animation.transitionDuration).toBe(100);
		});

		it("should get gameplay config", () => {
			expect(config.gameplay.interactionDistance).toBe(15);
			expect(config.gameplay.heroSpeed).toBe(5);
		});

		it("should get storage config", () => {
			expect(config.storage.progressKey).toBe("legacys-end-progress");
			expect(config.storage.version).toBe("1.0.0");
		});

		it("should get features config", () => {
			expect(config.features.voiceControl).toBe(false);
			expect(config.features.debugMode).toBe(true);
		});

		it("should get viewport config", () => {
			expect(config.viewport.zones.theme.darkThreshold).toBe(50);
		});

		it("should get value by path", () => {
			expect(config.get("animation.rewardDuration")).toBe(100);
			expect(config.get("gameplay.interactionDistance")).toBe(15);
			expect(config.get("features.voiceControl")).toBe(false);
		});

		it("should return undefined for invalid path", () => {
			expect(config.get("invalid.path")).toBeUndefined();
		});

		it("should check if feature is enabled", () => {
			expect(config.isFeatureEnabled("debugMode")).toBe(true);
			expect(config.isFeatureEnabled("voiceControl")).toBe(false);
		});

		it("should get all configuration", () => {
			const all = config.getAll();
			expect(all.env).toBe("test");
			expect(all.animation).toBeDefined();
			expect(all.gameplay).toBeDefined();
		});
	});

	describe("Configuration overrides", () => {
		it("should apply overrides", () => {
			const config = new GameConfiguration("test", {
				animation: {
					rewardDuration: 500,
				},
			});
			expect(config.animation.rewardDuration).toBe(500);
			expect(config.animation.transitionDuration).toBe(100); // Other values unchanged
		});

		it("should deep merge overrides", () => {
			const config = new GameConfiguration("test", {
				viewport: {
					zones: {
						theme: {
							darkThreshold: 75,
						},
					},
				},
			});
			expect(config.viewport.zones.theme.darkThreshold).toBe(75);
			expect(config.viewport.zones.context.legacyX).toBe(50); // Unchanged
		});
	});

	describe("Validation", () => {
		it("should throw on negative reward duration", () => {
			expect(() => {
				new GameConfiguration("test", {
					animation: {
						rewardDuration: -1,
					},
				});
			}).toThrow("Reward duration must be positive");
		});

		it("should throw on negative interaction distance", () => {
			expect(() => {
				new GameConfiguration("test", {
					gameplay: {
						interactionDistance: -1,
					},
				});
			}).toThrow("Interaction distance must be positive");
		});

		it("should throw on zero hero speed", () => {
			expect(() => {
				new GameConfiguration("test", {
					gameplay: {
						heroSpeed: 0,
					},
				});
			}).toThrow("Hero speed must be positive");
		});

		it("should throw on empty storage key", () => {
			expect(() => {
				new GameConfiguration("test", {
					storage: {
						progressKey: "",
					},
				});
			}).toThrow("Storage key cannot be empty");
		});
	});
});
