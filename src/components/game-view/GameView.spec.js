import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameEvents } from "../../core/event-bus.js";
import { logger } from "../../services/logger-service.js";
import { GameView } from "./game-view.js";

/**
 * Creates a complete mock app that satisfies the IGameContext interface.
 */
function getMockApp(overrides = {}) {
	return {
		addController: vi.fn(),
		getChapterData: vi.fn(),
		gameState: {
			setPaused: vi.fn(),
			isPaused: { get: vi.fn(() => false) },
			isQuestCompleted: { get: vi.fn(() => false) },
			showDialog: { get: vi.fn(() => false) },
			heroPos: { get: vi.fn(() => ({ x: 0, y: 0 })) },
			isEvolving: { get: vi.fn(() => false) },
			hotSwitchState: { get: vi.fn(() => "new") },
			hasCollectedItem: { get: vi.fn(() => false) },
			isRewardCollected: { get: vi.fn(() => false) },
			themeMode: { get: vi.fn(() => "light") },
			lockedMessage: { get: vi.fn(() => null) },
			getState: vi.fn(() => ({
				ui: { isPaused: false },
				heroPos: { x: 0, y: 0 },
				hasCollectedItem: false,
				themeMode: "light",
				hotSwitchState: "new",
				isQuestCompleted: false,
				showDialog: false,
			})),
			setHeroPosition: vi.fn(),
			setCurrentDialogText: vi.fn(),
			setShowDialog: vi.fn(),
			setCollectedItem: vi.fn(),
		},
		handleMove: vi.fn(),
		handleInteract: vi.fn(),
		getActiveService: vi.fn(() => null),
		profileProvider: { setValue: vi.fn() },
		suitProvider: { setValue: vi.fn() },
		gearProvider: { setValue: vi.fn() },
		powerProvider: { setValue: vi.fn() },
		masteryProvider: { setValue: vi.fn() },
		serviceController: { loadUserData: vi.fn(), options: {} },
		characterContexts: { options: {} },
		interaction: {
			isCloseToNpc: vi.fn(),
			interact: vi.fn(),
		},
		gameService: {
			setLevel: vi.fn(),
			giveItem: vi.fn(),
			teleport: vi.fn(),
			getState: vi.fn(),
			setTheme: vi.fn(),
			startQuest: vi.fn(),
			completeQuest: vi.fn(),
			returnToHub: vi.fn(),
			listQuests: vi.fn(() => []),
			getProgress: vi.fn(),
			resetProgress: vi.fn(),
		},
		questController: {
			currentChapter: { exitZone: { x: 10, y: 10 } },
			hasExitZone: vi.fn(() => true),
			getCurrentChapterNumber: vi.fn(() => 1),
			getTotalChapters: vi.fn(() => 3),
			isLastChapter: vi.fn(() => false),
			hasNextChapter: vi.fn(() => true),
		},
		eventBus: (() => {
			const handlers = new Map();
			return {
				on: vi.fn((event, handler) => {
					if (!handlers.has(event)) {
						handlers.set(event, []);
					}
					handlers.get(event).push(handler);
				}),
				off: vi.fn((event, handler) => {
					if (handlers.has(event)) {
						const eventHandlers = handlers.get(event);
						const index = eventHandlers.indexOf(handler);
						if (index > -1) {
							eventHandlers.splice(index, 1);
						}
					}
				}),
				emit: vi.fn((event, data) => {
					if (handlers.has(event)) {
						for (const handler of handlers.get(event)) {
							handler(data);
						}
					}
				}),
			};
		})(),
		commandBus: {
			execute: vi.fn(),
		},
		sessionManager: {
			getGameState: vi.fn(() => ({
				isLoading: false,
				isInHub: false,
			})),
		},
		// Mock services required by VoiceController
		aiService: {
			checkAvailability: vi.fn().mockResolvedValue("no"),
			createSession: vi.fn(),
			getSession: vi.fn(),
			destroySession: vi.fn(),
		},
		voiceSynthesisService: {
			speak: vi.fn(),
			cancel: vi.fn(),
		},
		...overrides,
	};
}

describe("GameView Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		vi.spyOn(logger, "warn").mockImplementation(() => {});
	});

	it("renders loading state when no config is provided", async () => {
		const el = /** @type {any} */ (document.createElement("game-view"));
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain("Loading level data...");
	});

	it("renders game-viewport when config is provided", async () => {
		const el = /** @type {any} */ (document.createElement("game-view"));
		el.app = getMockApp();
		el.gameState = /** @type {any} */ ({
			config: {
				zones: [],
			},
			hero: {
				pos: { x: 0, y: 0 },
				isEvolving: false,
				hotSwitchState: null,
			},
			ui: {
				isPaused: false,
				showDialog: false,
				isQuestCompleted: false,
				lockedMessage: "",
			},
			quest: {
				data: {},
				chapterNumber: 1,
				totalChapters: 3,
				isLastChapter: false,
				levelId: "1",
			},
			levelState: {
				hasCollectedItem: false,
				isRewardCollected: false,
				isCloseToTarget: false,
			},
		});
		document.body.appendChild(el);
		await el.updateComplete;

		const viewport = el.shadowRoot?.querySelector("game-viewport");
		expect(viewport).toBeTruthy();
	});

	describe("Keyboard Controller", () => {
		/** @type {GameView} */
		let el;
		/** @type {any} */
		let mockApp;

		beforeEach(async () => {
			mockApp = getMockApp();
			el = /** @type {any} */ (document.createElement("game-view"));
			el.app = mockApp;
			el.gameState = /** @type {any} */ ({
				ui: {
					isPaused: false,
					showDialog: false,
					isQuestCompleted: false,
					lockedMessage: "",
				},
				hero: { pos: { x: 0, y: 0 }, isEvolving: false, hotSwitchState: null },
				config: { zones: [] },
				quest: {
					data: {},
					chapterNumber: 0,
					totalChapters: 0,
					isLastChapter: false,
					levelId: "",
				},
				levelState: {
					hasCollectedItem: false,
					isRewardCollected: false,
					isCloseToTarget: false,
				},
			});
			document.body.appendChild(el);
			await el.updateComplete;
		});

		it("should initialize keyboard controller", () => {
			expect(el.keyboard).toBeDefined();
			expect(el.keyboard?.options.speed).toBe(2.5);
		});

		it("should handle HERO_MOVE_INPUT event", () => {
			// Emit event through event bus
			mockApp.eventBus.emit(GameEvents.HERO_MOVE_INPUT, { dx: 1, dy: 0 });

			// Verify it executes a MoveHeroCommand via commandBus
			expect(mockApp.commandBus.execute).toHaveBeenCalled();
			const command = mockApp.commandBus.execute.mock.calls[0][0];
			expect(command.name).toBe("MoveHero");
			expect(command.metadata).toEqual({ dx: 1, dy: 0 });
			// Verify eventBus is passed
			expect(command.eventBus).toBeDefined();
			expect(command.eventBus).toBe(mockApp.eventBus);
		});

		it("should initialize keyboard with correct speed", () => {
			expect(el.keyboard).toBeDefined();
			expect(el.keyboard?.options.speed).toBe(2.5);
		});

		it("should have interaction controller available in keyboard context", () => {
			// Regression test for context initialization order
			// KeyboardController needs interaction controller to execute InteractCommand
			expect(el.keyboard?.options.interaction).toBeDefined();
		});

		it("should emit LEVEL_COMPLETED event on level completion", () => {
			const spy = vi.spyOn(mockApp.eventBus, "emit");

			// Simulate level completion
			el.handleLevelComplete();

			expect(spy).toHaveBeenCalledWith(GameEvents.LEVEL_COMPLETED);
		});
	});
});
