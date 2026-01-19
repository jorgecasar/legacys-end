import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterContextController } from "./character-context-controller.js";

describe("CharacterContextController", () => {
	/** @type {any} */
	let host;
	/** @type {CharacterContextController} */
	let controller;
	/** @type {any} */
	let characterProvider;
	/** @type {any} */
	let heroState;
	/** @type {any} */
	let questState;
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

		heroState = {
			hotSwitchState: new Signal.State("legacy"),
		};

		questState = {
			hasCollectedItem: new Signal.State(false),
			isRewardCollected: new Signal.State(false),
		};

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
			heroState,
			questState,
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
			questState.isRewardCollected.set(true);

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
			questState.hasCollectedItem.set(true);

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
			questState.hasCollectedItem.set(false);

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: null },
				}),
			);
		});

		it("should update power context based on hot switch state", () => {
			heroState.hotSwitchState.set("new");
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
				heroState,
				questState,
				questController: mockQuestController,
				themeService: mockThemeService,
			});

			expect(() => controller.hostUpdate()).not.toThrow();
		});
	});
});
