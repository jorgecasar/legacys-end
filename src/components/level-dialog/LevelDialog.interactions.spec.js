import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameEvents } from "../../core/event-bus.js";
import { logger } from "../../services/logger-service.js";
import { GameView } from "../game-view/game-view.js";
import { LevelDialog } from "./LevelDialog.js"; // Mock child component

// Mock WebAwesome components to avoid rendering issues in JSDOM
vi.mock("@awesome.me/webawesome/dist/components/dialog/dialog.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/button/button.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/icon/icon.js", () => ({}));
vi.mock("../game-viewport/game-viewport.js", () => ({})); // Mock child component

describe("LevelDialog Interactions", () => {
	let element;
	/** @type {any} */
	let container;

	beforeEach(async () => {
		container = document.createElement("div");
		document.body.appendChild(container);
		vi.spyOn(logger, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("should increment slideIndex when NEXT is clicked", async () => {
		// Setup complex config to have multiple slides
		const config = {
			title: "Test Level",
			description: "Intro",
			problemDesc: "Problem",
			codeSnippets: { start: [{ title: "Snippet", code: "const x = 1;" }] },
		};

		element = new LevelDialog();
		element.config = /** @type {any} */ (config);
		container.appendChild(element);
		await element.updateComplete;

		// Initial state
		expect(element.slideIndex).toBe(0);

		// Find NEXT button
		const buttons = element.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons) throw new Error("Shadow root not found");
		const nextBtn = buttons[buttons.length - 1];

		expect(nextBtn.textContent.trim()).toContain("NEXT");

		nextBtn.click();
		await element.updateComplete;

		expect(element.slideIndex).toBe(1);
	});

	it("should decrement slideIndex when PREV is clicked", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			problemDesc: "Problem",
		};

		element = new LevelDialog();
		element.config = /** @type {any} */ (config);
		element.slideIndex = 1; // Start at second slide
		container.appendChild(element);
		await element.updateComplete;

		expect(element.slideIndex).toBe(1);

		const buttons = element.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons) throw new Error("Shadow root not found");
		const prevBtn = buttons[0]; // First button is PREV

		expect(prevBtn.textContent.trim()).toContain("PREV");

		prevBtn.click();
		await element.updateComplete;

		expect(element.slideIndex).toBe(0);
	});

	it("should dispatch 'complete' event on final slide button click", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			// Only 2 slides total: Narrative -> Confirmation
		};

		element = new LevelDialog();
		element.config = /** @type {any} */ (config);
		// Narrative is index 0. Confirmation is index 1 (last).
		element.slideIndex = 1;
		container.appendChild(element);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener("complete", completeSpy);

		const buttons = element.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons) throw new Error("Shadow root not found");
		const actionBtn = buttons[buttons.length - 1]; // "EVOLVE" or "COMPLETE"

		expect(actionBtn.textContent.trim()).toMatch(/EVOLVE|COMPLETE/);

		actionBtn.click();

		expect(completeSpy).toHaveBeenCalled();
	});
});

/**
 * Creates a complete mock app that satisfies the IGameContext interface.
 */
function getMockApp(overrides = {}) {
	return {
		showDialog: true,
		gameState: {
			setCollectedItem: vi.fn(),
			setPaused: vi.fn(),
			setShowDialog: vi.fn(),
			setCurrentDialogText: vi.fn(),
			isPaused: { get: vi.fn(() => false) },
			isQuestCompleted: { get: vi.fn(() => false) },
			showDialog: { get: vi.fn(() => true) },
			heroPos: { get: vi.fn(() => ({ x: 0, y: 0 })) },
			isEvolving: { get: vi.fn(() => false) },
			hotSwitchState: { get: vi.fn(() => "new") },
			hasCollectedItem: { get: vi.fn(() => false) },
			isRewardCollected: { get: vi.fn(() => false) },
			lockedMessage: { get: vi.fn(() => null) },
			getState: vi.fn(() => ({
				themeMode: "light",
				hotSwitchState: "new",
				hasCollectedItem: false,
				heroPos: { x: 0, y: 0 },
				isPaused: false,
				isQuestCompleted: false,
				showDialog: true,
			})),
		},
		isRewardCollected: false,
		questController: {
			currentChapter: { id: "1" },
			hasNextChapter: vi.fn(() => false),
		},
		gameService: {},
		addController: vi.fn(),
		eventBus: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
		commandBus: { execute: vi.fn() },
		sessionManager: {},
		progressService: { updateChapterState: vi.fn() },
		serviceController: {
			getActiveService: vi.fn(),
			loadUserData: vi.fn(),
			options: {},
		},
		characterContexts: { options: {} },
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

describe("GameView Integration", () => {
	let element;
	/** @type {any} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		vi.spyOn(logger, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("should re-dispatch 'complete' event from level-dialog", async () => {
		element = new GameView();
		element.gameState = /** @type {any} */ ({
			config: {
				zones: [
					{
						x: 50,
						y: 40,
						width: 50,
						height: 60,
						type: "CONTEXT_CHANGE",
						payload: "legacy",
					},
				],
			},
			hero: { pos: { x: 0, y: 0 }, isEvolving: false, hotSwitchState: null },
			ui: {
				showDialog: true,
				isPaused: false,
				isQuestCompleted: false,
				lockedMessage: "",
			},
			quest: {
				data: { name: "Test Quest" },
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

		// Mock app for handleLevelComplete
		element.app = getMockApp();
		container.appendChild(element);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener("complete", completeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		// Mock gameController locally on the element		// Mock gameController on element
		element.gameController = /** @type {any} */ ({
			handleLevelCompleted: vi.fn(),
		});

		dialog?.dispatchEvent(new CustomEvent("complete"));

		// Decoupled logic: GameView calls gameController.handleLevelCompleted
		expect(
			/** @type {any} */ (element).gameController.handleLevelCompleted,
		).toHaveBeenCalled();
	});

	it("should re-dispatch 'close-dialog' event from level-dialog close", async () => {
		element = new GameView();
		element.gameState = /** @type {any} */ ({
			config: {
				zones: [
					{
						x: 50,
						y: 40,
						width: 50,
						height: 60,
						type: "CONTEXT_CHANGE",
						payload: "legacy",
					},
				],
			},
			hero: { pos: { x: 0, y: 0 }, isEvolving: false, hotSwitchState: null },
			ui: {
				showDialog: true,
				isPaused: false,
				isQuestCompleted: false,
				lockedMessage: "",
			},
			quest: {
				data: { name: "Test Quest", id: "quest-1" },
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
		// Mock app for close-dialog
		element.app = getMockApp();
		container.appendChild(element);
		await element.updateComplete;

		const closeSpy = vi.fn();
		element.addEventListener("close-dialog", closeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		dialog?.dispatchEvent(new CustomEvent("close"));

		expect(closeSpy).toHaveBeenCalled();
	});

	it("should handle 'hero-auto-move' event payload correctly", async () => {
		element = new GameView();
		element.gameState = /** @type {any} */ ({
			ui: { showDialog: false },
		});

		/** @type {((data: {x: number, y: number}) => void) | undefined} */
		let autoMoveCallback;
		const mockEventBus = {
			on: vi.fn((event, cb) => {
				if (event === GameEvents.HERO_AUTO_MOVE) autoMoveCallback = cb;
			}),
			off: vi.fn(),
			emit: vi.fn(),
		};

		element.app = getMockApp({ eventBus: mockEventBus });

		// Spy on moveTo
		element.moveTo = vi.fn();

		container.appendChild(element);
		await element.updateComplete;

		expect(autoMoveCallback).toBeDefined();

		// Trigger with plain object payload (NOT CustomEvent)
		if (autoMoveCallback) {
			autoMoveCallback({ x: 123, y: 456 });
		}

		expect(element.moveTo).toHaveBeenCalledWith(123, 456);
	});

	it("should ignore global interaction when dialog is open", async () => {
		element = new GameView();
		element.gameState = /** @type {any} */ ({
			ui: { showDialog: true },
		});
		element.app = getMockApp();
		container.appendChild(element);
		await element.updateComplete;

		// Override interaction after setupControllers has run
		element.interaction = /** @type {any} */ ({ handleInteract: vi.fn() });

		element.handleInteract();

		expect(element.app.commandBus.execute).not.toHaveBeenCalled();
		expect(
			/** @type {import('vitest').Mock} */ (
				/** @type {any} */ (element.interaction).handleInteract
			),
		).not.toHaveBeenCalled();
	});
});
