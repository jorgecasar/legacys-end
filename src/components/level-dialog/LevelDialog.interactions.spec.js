import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HotSwitchStates, ThemeModes } from "../../core/constants.js";
import { UIEvents } from "../../core/events.js";

import { QuestView } from "../quest-view/QuestView.js";
import "../quest-view/quest-view.js";

import { LevelDialog } from "./LevelDialog.js"; // Mock child component

vi.mock("../game-viewport/game-viewport.js", () => ({})); // Mock child component

import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";

import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { gameStoreContext } from "../../core/store.js";

/** @typedef {import("../../types/game.d.js").IHeroStateService} IHeroStateService */
/** @typedef {import("../../types/game.d.js").IQuestStateService} IQuestStateService */
/** @typedef {import("../../types/game.d.js").IWorldStateService} IWorldStateService */
/** @typedef {import("../../types/services.d.js").IQuestController} IQuestController */
/** @typedef {import("../../types/services.d.js").ISessionService} ISessionService */
/** @typedef {import("../../types/quests.d.js").Quest} Quest */

class TestContextWrapper extends LitElement {
	/** @override */
	static properties = {
		gameStore: { type: Object },
		questController: { type: Object },
		sessionService: { type: Object },
	};

	constructor() {
		super();
		/** @type {any} */
		this.gameStore = undefined;
		/** @type {IQuestController | undefined} */
		this.questController = undefined;
		/** @type {ISessionService | undefined} */
		this.sessionService = undefined;

		this.gameStoreProvider = new ContextProvider(this, {
			context: gameStoreContext,
		});
		this._qcProvider = new ContextProvider(this, {
			context: questControllerContext,
		});
		this._sessionProvider = new ContextProvider(this, {
			context: sessionContext,
		});
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 * @override
	 */
	update(changedProperties) {
		super.update(changedProperties);
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		if (changedProperties.has("gameStore") && this.gameStore != null) {
			this.gameStoreProvider.setValue(this.gameStore);
		}
		if (
			changedProperties.has("questController") &&
			this.questController != null
		) {
			this._qcProvider.setValue(
				/** @type {IQuestController} */ (this.questController),
			);
		}
		if (
			changedProperties.has("sessionService") &&
			this.sessionService != null
		) {
			this._sessionProvider.setValue(
				/** @type {ISessionService} */ (this.sessionService),
			);
		}
	}

	/**
	 * @override
	 */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper", TestContextWrapper);

describe("LevelDialog Interactions", () => {
	/** @type {LevelDialog} */
	let element;
	/** @type {HTMLElement} */
	let container;

	beforeEach(async () => {
		container = document.createElement("div");
		document.body.appendChild(container);
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

		const worldStateMock = {
			currentSlideIndex: new Signal.State(0),
			nextSlide: vi.fn(() => {
				worldStateMock.currentSlideIndex.set(
					worldStateMock.currentSlideIndex.get() + 1,
				);
			}),
			prevSlide: vi.fn(() => {
				worldStateMock.currentSlideIndex.set(
					Math.max(worldStateMock.currentSlideIndex.get() - 1, 0),
				);
			}),
			setCurrentDialogText: vi.fn(),
			setNextDialogText: vi.fn(),
		};

		element = new LevelDialog();
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({ currentChapter: config })
		);
		wrapper.gameStore = {
			world: worldStateMock,
			quest: {},
			hero: {},
		};
		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await wrapper.updateComplete;
		await element.updateComplete;

		// Initial state
		expect(worldStateMock.currentSlideIndex.get()).toBe(0);

		// Find NEXT button in footer
		const footer = element.shadowRoot?.querySelector("level-dialog-footer");
		// @ts-expect-error
		await footer?.updateComplete;
		const buttons = footer?.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons || buttons.length === 0) throw new Error("Buttons not found");
		const nextBtn = Array.from(buttons).find((b) =>
			b.textContent?.trim().includes("NEXT"),
		);

		if (nextBtn) {
			nextBtn.click();
			await element.updateComplete;
			expect(worldStateMock.currentSlideIndex.get()).toBe(1);
			expect(worldStateMock.nextSlide).toHaveBeenCalled();
		}
	});

	it("should decrement slideIndex when PREV is clicked", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			problemDesc: "Problem",
		};

		const worldStateMock = {
			currentSlideIndex: new Signal.State(1),
			nextSlide: vi.fn(() => {
				worldStateMock.currentSlideIndex.set(
					worldStateMock.currentSlideIndex.get() + 1,
				);
			}),
			prevSlide: vi.fn(() => {
				worldStateMock.currentSlideIndex.set(
					Math.max(worldStateMock.currentSlideIndex.get() - 1, 0),
				);
			}),
			setCurrentDialogText: vi.fn(),
			setNextDialogText: vi.fn(),
		};

		element = new LevelDialog();
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({ currentChapter: config })
		);
		wrapper.gameStore = {
			world: worldStateMock,
			quest: {},
			hero: {},
		};
		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await wrapper.updateComplete;
		await element.updateComplete;

		expect(worldStateMock.currentSlideIndex.get()).toBe(1);

		const footer = element.shadowRoot?.querySelector("level-dialog-footer");
		// @ts-expect-error
		await footer?.updateComplete;
		const buttons = footer?.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons || buttons.length === 0) throw new Error("Buttons not found");
		const prevBtn = buttons[0]; // First button is PREV

		if (prevBtn) {
			expect(prevBtn.textContent?.trim()).toContain("PREV");
			prevBtn.click();
			await element.updateComplete;
			expect(worldStateMock.currentSlideIndex.get()).toBe(0);
			expect(worldStateMock.prevSlide).toHaveBeenCalled();
		}
	});

	it("should dispatch 'complete' event on final slide button click", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			// Only 2 slides total: Narrative -> Confirmation
		};

		const worldStateMock = {
			currentSlideIndex: new Signal.State(1),
			nextSlide: vi.fn(),
			prevSlide: vi.fn(),
			setCurrentDialogText: vi.fn(),
			setNextDialogText: vi.fn(),
		};

		element = new LevelDialog();
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({ currentChapter: config })
		);
		wrapper.gameStore = {
			world: worldStateMock,
			quest: {},
			hero: {},
		};
		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await wrapper.updateComplete;
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener(UIEvents.COMPLETE, completeSpy);

		const footer = element.shadowRoot?.querySelector("level-dialog-footer");
		// @ts-expect-error
		await footer?.updateComplete;
		const buttons = footer?.shadowRoot?.querySelectorAll("wa-button");
		if (!buttons || buttons.length === 0) throw new Error("Buttons not found");
		const actionBtn = buttons[buttons.length - 1]; // "EVOLVE" or "COMPLETE"

		if (actionBtn) {
			expect(actionBtn.textContent?.trim()).toMatch(/EVOLVE|COMPLETE/);
			actionBtn.click();
			expect(completeSpy).toHaveBeenCalled();
		}
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
			hotSwitchState: { get: vi.fn(() => HotSwitchStates.NEW) },
			hasCollectedItem: { get: vi.fn(() => false) },
			isRewardCollected: { get: vi.fn(() => false) },
			lockedMessage: { get: vi.fn(() => null) },
			getState: vi.fn(() => ({
				themeMode: ThemeModes.LIGHT,
				hotSwitchState: HotSwitchStates.NEW,
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
		addController: vi.fn(),

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
	/** @type {QuestView} */
	let element;
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("should re-dispatch 'complete' event from level-dialog", async () => {
		element = new QuestView();
		// @ts-expect-error
		element.gameState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
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
				hero: {
					pos: { x: 0, y: 0 },
					isEvolving: false,
					hotSwitchState: null,
				},
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
			})
		);

		// Mock app for handleLevelComplete
		/** @type {any} */ (element).app = getMockApp();

		// Wrap in context provider
		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			hero: {
				setPos: vi.fn(),
				setIsEvolving: vi.fn(),
				setHotSwitchState: vi.fn(),
				pos: { get: vi.fn(() => ({ x: 0, y: 0 })) },
				hotSwitchState: { get: vi.fn(() => HotSwitchStates.NEW) },
				isEvolving: { get: vi.fn(() => false) },
				imageSrc: { get: vi.fn(() => "") },
			},
			quest: {
				resetQuestState: vi.fn(),
				resetChapterState: vi.fn(),
				setHasCollectedItem: vi.fn(),
				setIsRewardCollected: vi.fn(),
				setIsQuestCompleted: vi.fn(),
				setLockedMessage: vi.fn(),
				setCurrentChapterNumber: vi.fn(),
				setTotalChapters: vi.fn(),
				setLevelTitle: vi.fn(),
				setQuestTitle: vi.fn(),
				setCurrentChapterId: vi.fn(),
				hasCollectedItem: { get: vi.fn(() => false) },
				isRewardCollected: { get: vi.fn(() => false) },
				isQuestCompleted: { get: vi.fn(() => false) },
				lockedMessage: { get: vi.fn(() => null) },
				currentChapterNumber: { get: vi.fn(() => 1) },
				totalChapters: { get: vi.fn(() => 10) },
				levelTitle: { get: vi.fn(() => "Test Level") },
				questTitle: { get: vi.fn(() => "Test Quest") },
				currentChapterId: { get: vi.fn(() => "ch1") },
			},
			world: {
				setPaused: vi.fn(),
				setShowDialog: vi.fn(),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				nextSlide: vi.fn(),
				prevSlide: vi.fn(),
				setSlideIndex: vi.fn(),
				resetSlideIndex: vi.fn(),
				resetWorldState: vi.fn(),
				isPaused: { get: vi.fn(() => false) },
				showDialog: { get: vi.fn(() => true) },
				currentDialogText: { get: vi.fn(() => "") },
				nextDialogText: { get: vi.fn(() => "") },
				currentSlideIndex: new Signal.State(0),
			},
		};

		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);
		// Needed by LevelDialog inside QuestView
		const completeChapterSpy = vi.fn();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({
				currentChapter: { description: "Test" },
				completeChapter: completeChapterSpy,
			})
		);

		// Manually set questController on the element if it relies on property injection
		// or ensure the context provider is ready
		element.questController = wrapper.questController;

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener(UIEvents.COMPLETE, completeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		// Mock handleLevelComplete on viewport directly if needed or verify event flow
		const viewport = element.shadowRoot?.querySelector("game-viewport");
		if (!viewport) throw new Error("Viewport not found");

		dialog?.dispatchEvent(
			new CustomEvent(UIEvents.COMPLETE, { bubbles: true, composed: true }),
		);

		expect(completeChapterSpy).toHaveBeenCalled();
	});

	it("should re-dispatch 'close-dialog' event from level-dialog close", async () => {
		element = new QuestView();
		// @ts-expect-error
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
				data: /** @type {Quest} */ (
					/** @type {unknown} */ ({ name: "Test Quest", id: "quest-1" })
				),
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
		/** @type {any} */ (element).app = getMockApp();

		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				isPaused: new Signal.State(false),
				showDialog: new Signal.State(true), // Dialog open
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				currentSlideIndex: new Signal.State(0),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);
		wrapper.questController = /** @type {IQuestController} */ ({
			currentChapter: {},
		});

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const closeSpy = vi.fn();
		element.addEventListener(UIEvents.CLOSE_DIALOG, closeSpy);

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		dialog?.dispatchEvent(new CustomEvent(UIEvents.CLOSE));

		expect(closeSpy).toHaveBeenCalled();
	});

	it("should ignore global interaction when dialog is open", async () => {
		element = new QuestView();
		// @ts-expect-error
		element.gameState = /** @type {any} */ ({
			config: { zones: [] },
			ui: { showDialog: true },
			quest: { levelId: "1" },
		});
		/** @type {any} */ (element).app = getMockApp();

		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				isPaused: new Signal.State(false),
				showDialog: new Signal.State(true), // Dialog Open
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				setShowDialog: vi.fn(),
				currentSlideIndex: new Signal.State(0),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);

		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		const viewport = element.shadowRoot?.querySelector("game-viewport");
		if (!viewport) throw new Error("Viewport not found");

		// Mock handleInteract directly on viewport element level
		viewport.handleInteract = vi.fn();
		viewport.interaction = /** @type {any} */ ({ handleInteract: vi.fn() });

		viewport.handleInteract();

		expect(viewport.interaction?.handleInteract).not.toHaveBeenCalled();
	});
});
