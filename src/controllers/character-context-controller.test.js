import { Signal } from "@lit-labs/signals";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { themeContext } from "../contexts/theme-context.js";
import { HotSwitchStates, ThemeModes } from "../core/constants.js";
import { gameStoreContext } from "../state/game-store.js";
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
	let mockGameStore;
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
			character: {},
		};

		mockGameStore = {
			hero: {
				hotSwitchState: new Signal.State(HotSwitchStates.LEGACY),
			},
			quest: {
				hasCollectedItem: new Signal.State(false),
				isRewardCollected: new Signal.State(false),
			},
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

			expect(host.character).toMatchObject({
				suit: { image: "/assets/level_1/hero.png" },
			});
		});

		it("should update suit context with reward image when evolved", () => {
			mockQuestController.currentChapter = {
				id: "level_1",
				hero: {
					image: "/assets/level_1/hero.png",
					reward: "/assets/level_1/hero-reward.png",
				},
			};
			mockGameStore.quest.isRewardCollected.set(true);

			initController();
			controller.hostUpdate();

			initController();
			controller.hostUpdate();

			expect(host.character).toMatchObject({
				suit: { image: "/assets/level_1/hero-reward.png" },
			});
		});
	});
});
