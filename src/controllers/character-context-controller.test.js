import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HotSwitchStates, ThemeModes } from "../core/constants.js";
import { CharacterContextController } from "./character-context-controller.js";

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

describe("CharacterContextController", () => {
	/** @type {any} */
	let host;
	/** @type {CharacterContextController} */
	let controller;
	// Mock context states
	/** @type {any} */
	let mockHeroState;
	/** @type {any} */
	let mockQuestState;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockThemeService;

	beforeEach(() => {
		vi.clearAllMocks();
		contextMocks.clear();

		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
			characterProvider: { setValue: vi.fn() },
		};

		mockHeroState = {
			hotSwitchState: new Signal.State(HotSwitchStates.LEGACY),
		};

		mockQuestState = {
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

		mockThemeService = {
			themeMode: {
				get: vi.fn().mockReturnValue(ThemeModes.LIGHT),
			},
		};
	});

	const initController = () => {
		controller = new CharacterContextController(host);

		// Manual injection via the stored callbacks from the mock ContextConsumer
		const callbacks = Array.from(contextMocks.values());
		// heroState, questState, questController, themeService
		if (callbacks[0]) callbacks[0](mockHeroState);
		if (callbacks[1]) callbacks[1](mockQuestState);
		if (callbacks[2]) callbacks[2](mockQuestController);
		if (callbacks[3]) callbacks[3](mockThemeService);
	};

	it("should initialize and add controller to host", () => {
		initController();
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

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.characterProvider.setValue).toHaveBeenCalledWith(
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
			mockQuestState.isRewardCollected.set(true);

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.characterProvider.setValue).toHaveBeenCalledWith(
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
			mockQuestState.hasCollectedItem.set(true);

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.characterProvider.setValue).toHaveBeenCalledWith(
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
			mockQuestState.hasCollectedItem.set(false);

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: null },
				}),
			);
		});

		it("should update power context based on hot switch state", () => {
			mockHeroState.hotSwitchState.set(HotSwitchStates.NEW);
			mockThemeService.themeMode.get.mockReturnValue(ThemeModes.DARK);

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					power: {
						effect: "stable",
						intensity: "high",
					},
				}),
			);
		});
	});
});
