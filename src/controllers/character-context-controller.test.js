import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { CharacterContextController } from "./character-context-controller.js";

describe("CharacterContextController", () => {
	/** @type {any} */
	let host;
	/** @type {CharacterContextController} */
	let controller;
	/** @type {any} */
	let characterProvider;
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockThemeService;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
		characterProvider = { setValue: vi.fn() };

		// Use FakeGameStateService instead of mock
		fakeGameState = new FakeGameStateService();
		// Set default test state
		fakeGameState.hotSwitchState.set("legacy");
		fakeGameState.hasCollectedItem.set(false);
		fakeGameState.isRewardCollected.set(false);
		// Remove fakeGameState.themeMode.set("light"); -> no longer used

		mockQuestController = {
			currentChapter: {
				id: "level1",
				hero: { image: "hero.png", reward: "hero-reward.png" },
				reward: { image: "item.png" },
			},
		};

		// Mock ThemeService with a signal-like object
		mockThemeService = {
			themeMode: {
				get: vi.fn().mockReturnValue("light"),
			},
		};

		controller = new CharacterContextController(/** @type {any} */ (host), {
			gameState: fakeGameState,
			questController: mockQuestController,
			characterProvider,
			themeService: mockThemeService,
		});
	});

	it("should initialize and add controller to host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("update", () => {
		it("should update suit context based on level and reward", () => {
			mockQuestController.currentChapter = {
				id: "level_1",
				hero: {
					image: "/assets/level_1/hero.png",
					reward: "/assets/level_1/hero-reward.png",
				},
			};

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					suit: { image: "/assets/level_1/hero.png" },
				}),
			);
		});

		it("should update suit context with reward image when evolved", () => {
			mockQuestController.currentChapter = {
				id: "level_1",
				hero: {
					image: "/assets/level_1/hero.png",
					reward: "/assets/level_1/hero-reward.png",
				},
			};
			fakeGameState.isRewardCollected.set(true);

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					suit: { image: "/assets/level_1/hero-reward.png" },
				}),
			);
		});

		it("should update gear context when item is collected", () => {
			mockQuestController.currentChapter = {
				id: "level_2",
				reward: { image: "/assets/level_2/reward.png" },
			};
			fakeGameState.hasCollectedItem.set(true);

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: "/assets/level_2/reward.png" },
				}),
			);
		});

		it("should clear gear context when item is not collected", () => {
			mockQuestController.currentChapter = {
				id: "level_2",
				reward: { image: "/assets/level_2/reward.png" },
			};
			fakeGameState.hasCollectedItem.set(false);

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: null },
				}),
			);
		});

		it("should update power context based on hot switch state", () => {
			fakeGameState.hotSwitchState.set("new");
			mockThemeService.themeMode.get.mockReturnValue("dark");

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					power: {
						effect: "stable",
						intensity: "high",
					},
				}),
			);
		});

		it("should not crash if characterProvider is missing", () => {
			controller = new CharacterContextController(/** @type {any} */ (host), {
				gameState: fakeGameState,
				questController: mockQuestController,
				themeService: mockThemeService,
			});

			expect(() => controller.hostUpdate()).not.toThrow();
		});
	});
});
