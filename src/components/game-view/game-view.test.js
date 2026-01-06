import { beforeEach, describe, expect, it, vi } from "vitest";
import "./game-view.js";

/** @typedef {import("./game-view.js").GameView} GameView */

describe("GameView Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders loading state when no config is provided", async () => {
		const el = /** @type {GameView} */ (document.createElement("game-view"));
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Loading level data...");
	});

	it("renders game-viewport when config is provided", async () => {
		const el = /** @type {GameView} */ (document.createElement("game-view"));
		el.gameState = {
			config: {
				canToggleTheme: true,
				hasHotSwitch: true,
				isFinalBoss: false,
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
		};
		document.body.appendChild(el);
		await el.updateComplete;

		const viewport = el.shadowRoot.querySelector("game-viewport");
		expect(viewport).toBeTruthy();
	});

	describe("Keyboard Controller", () => {
		/** @type {GameView} */
		let el;
		/** @type {any} */
		let mockApp;

		beforeEach(async () => {
			// Create mock app
			mockApp = {
				addController: vi.fn(),
				getChapterData: vi.fn(),
				gameState: {
					setPaused: vi.fn(),
					getState: vi.fn(() => ({
						ui: { isPaused: false },
						heroPos: { x: 0, y: 0 },
						hasCollectedItem: false,
					})),
					setHeroPosition: vi.fn(),
				},
				handleMove: vi.fn(), // Kept but probably unused
				handleInteract: vi.fn(), // Kept but probably unused
				getActiveService: vi.fn(() => null),
				profileProvider: { setValue: vi.fn() },
				suitProvider: { setValue: vi.fn() },
				gearProvider: { setValue: vi.fn() },
				powerProvider: { setValue: vi.fn() },
				masteryProvider: { setValue: vi.fn() },
				serviceController: null,
				characterContexts: null,
				gameService: {
					setLevel: vi.fn(),
					giveItem: vi.fn(),
					teleport: vi.fn(),
					getState: vi.fn(),
					setTheme: vi.fn(),
					startQuest: vi.fn(),
					completeQuest: vi.fn(),
					completeChapter: vi.fn(),
					returnToHub: vi.fn(),
					listQuests: vi.fn(() => []),
					getProgress: vi.fn(),
					resetProgress: vi.fn(),
				},
				questController: {
					currentChapter: { exitZone: { x: 10, y: 10 } },
					hasExitZone: vi.fn(() => true),
				},
			};

			el = /** @type {GameView} */ (document.createElement("game-view"));
			el.app = mockApp;
			el.gameState = {
				ui: {
					isPaused: false,
					showDialog: false,
					isQuestCompleted: false,
					lockedMessage: "",
				},
				hero: { pos: { x: 0, y: 0 }, isEvolving: false, hotSwitchState: null },
				config: { hasHotSwitch: false },
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
			};
			document.body.appendChild(el);
			await el.updateComplete;
		});

		it("should initialize keyboard controller", () => {
			expect(el.keyboard).toBeDefined();
			expect(el.keyboard.options.speed).toBe(2.5);
		});

		it("should update hero position when keyboard moves", () => {
			el.keyboard.options.onMove(1, 0);
			// handleMove logic in GameView calculates new position
			// With start (0,0) + (1,0) = (1,0). Clamped to min 2 => (2, 0)?
			// Actually boundaries are 2 to 98.
			// 0 + 1 = 1. Clamped to 2. y=0 clamped to 2.
			expect(mockApp.gameState.setHeroPosition).toHaveBeenCalledWith(2, 2);
		});

		it("should call interaction controller when keyboard interacts", () => {
			const spy = vi.spyOn(el.interaction, "handleInteract");
			el.keyboard.options.onInteract();
			expect(spy).toHaveBeenCalled();
		});

		it("should toggle pause when keyboard pauses", () => {
			el.keyboard.options.onPause();
			expect(mockApp.gameState.setPaused).toHaveBeenCalledWith(true);
		});
	});
});
