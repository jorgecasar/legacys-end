import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../services/logger-service.js";
import { QuestView } from "../quest-view/quest-view.js";
import { LevelDialog } from "./LevelDialog.js"; // Mock child component

// Mock WebAwesome components to avoid rendering issues in JSDOM
vi.mock("@awesome.me/webawesome/dist/components/dialog/dialog.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/button/button.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/icon/icon.js", () => ({}));
vi.mock("../game-viewport/game-viewport.js", () => ({})); // Mock child component

import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";

vi.mock("../../core/event-bus.js", () => ({
	GameEvents: {
		SLIDE_CHANGED: "slide-changed",
	},
}));

import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";

class TestContextWrapper extends LitElement {
	static properties = {
		heroState: { type: Object },
		questState: { type: Object },
		worldState: { type: Object },
	};

	constructor() {
		super();
		this.heroState = {};
		this.questState = {};
		this.worldState = {};

		this._heroProvider = new ContextProvider(this, {
			context: heroStateContext,
			initialValue: this.heroState,
		});
		this._questProvider = new ContextProvider(this, {
			context: questStateContext,
			initialValue: this.questState,
		});
		this._worldProvider = new ContextProvider(this, {
			context: worldStateContext,
			initialValue: this.worldState,
		});
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 */
	update(changedProperties) {
		super.update(changedProperties);
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 */
	updated(changedProperties) {
		if (changedProperties.has("heroState")) {
			this._heroProvider.setValue(this.heroState);
		}
		if (changedProperties.has("questState")) {
			this._questProvider.setValue(this.questState);
		}
		if (changedProperties.has("worldState")) {
			this._worldProvider.setValue(this.worldState);
		}
	}

	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper", TestContextWrapper);

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

describe("QuestView Integration", () => {
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
		element = new QuestView();
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

		// Wrap in context provider
		const wrapper = new TestContextWrapper();
		wrapper.heroState = element.app.gameState; // Use mock gamestate as service shim since they share props roughly or we just need presence
		wrapper.heroState = {
			setPos: vi.fn(),
			setIsEvolving: vi.fn(),
			setHotSwitchState: vi.fn(),
			pos: new Signal.State({ x: 0, y: 0 }),
			hotSwitchState: new Signal.State(null),
			isEvolving: new Signal.State(false),
		};
		wrapper.questState = {
			resetQuestState: vi.fn(),
			resetChapterState: vi.fn(),
			setHasCollectedItem: vi.fn(),
			setIsRewardCollected: vi.fn(),
			setIsQuestCompleted: vi.fn(),
			setLockedMessage: vi.fn(),
			hasCollectedItem: new Signal.State(false),
			isRewardCollected: new Signal.State(false),
			isQuestCompleted: new Signal.State(false),
			lockedMessage: new Signal.State(null),
		};
		wrapper.worldState = {
			setPaused: vi.fn(),
			setShowDialog: vi.fn(),
			setCurrentDialogText: vi.fn(),
			isPaused: new Signal.State(false),
			showDialog: new Signal.State(true),
			currentDialogText: new Signal.State(""),
		};

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener("complete", completeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		// Mock gameController on GameViewport
		const viewport = /** @type {any} */ (
			element.shadowRoot?.querySelector("game-viewport")
		);
		viewport.handleLevelComplete = vi.fn();
		viewport.gameController = {
			handleLevelCompleted: vi.fn(),
		};

		dialog?.dispatchEvent(new CustomEvent("complete"));

		expect(viewport.handleLevelComplete).toHaveBeenCalled();
	});

	it("should re-dispatch 'close-dialog' event from level-dialog close", async () => {
		element = new QuestView();
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

		const wrapper = new TestContextWrapper();
		wrapper.worldState = {
			isPaused: new Signal.State(false),
			showDialog: new Signal.State(true), // Dialog open
			setShowDialog: vi.fn(),
			setCurrentDialogText: vi.fn(),
		};
		wrapper.questState = { isQuestCompleted: new Signal.State(false) };
		wrapper.heroState = {};

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const closeSpy = vi.fn();
		element.addEventListener("close-dialog", closeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		dialog?.dispatchEvent(new CustomEvent("close"));

		expect(closeSpy).toHaveBeenCalled();
	});

	it("should ignore global interaction when dialog is open", async () => {
		element = new QuestView();
		element.gameState = /** @type {any} */ ({
			config: { zones: [] },
			ui: { showDialog: true },
			quest: { levelId: "1" },
		});
		element.app = getMockApp();

		const wrapper = new TestContextWrapper();
		wrapper.worldState = {
			isPaused: new Signal.State(false),
			showDialog: new Signal.State(true), // Dialog Open
			setCurrentDialogText: vi.fn(),
			setShowDialog: vi.fn(),
		};
		wrapper.questState = { isQuestCompleted: new Signal.State(false) };
		wrapper.heroState = {};

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const viewport = /** @type {any} */ (
			element.shadowRoot?.querySelector("game-viewport")
		);
		// Mock handleInteract directly on viewport element level since it's mocked in JSDOM
		viewport.handleInteract = vi.fn();
		viewport.interaction = { handleInteract: vi.fn() };

		viewport.handleInteract();

		expect(element.app.commandBus.execute).not.toHaveBeenCalled();
		expect(viewport.interaction.handleInteract).not.toHaveBeenCalled();
	});
});
