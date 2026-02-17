import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { gameStoreContext } from "../../state/game-store.js";

import "./quest-view.js";

/** @typedef {import("../../types/game.d.js").IHeroStateService} IHeroStateService */
/** @typedef {import("../../types/game.d.js").IQuestStateService} IQuestStateService */
/** @typedef {import("../../types/game.d.js").IWorldStateService} IWorldStateService */
/** @typedef {import("../../types/services.d.js").IQuestController} IQuestController */
/** @typedef {import("../../types/services.d.js").ISessionService} ISessionService */
/** @typedef {import("./QuestView.js").QuestView} QuestView */
/** @typedef {import("../../services/quest-registry-service.js").Quest} Quest */

// Mock child components
vi.mock("../game-viewport/game-viewport.js", () => ({}));
vi.mock("../level-dialog/level-dialog.js", () => ({}));
vi.mock("../pause-menu/pause-menu.js", () => ({}));
vi.mock("../victory-screen/victory-screen.js", () => ({}));

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
		this.qcProvider = new ContextProvider(this, {
			context: questControllerContext,
		});
		this.sessionProvider = new ContextProvider(this, {
			context: sessionContext,
		});
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
	}

	/**
	 * @param {import('lit').PropertyValues} changedProperties
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
			this.qcProvider.setValue(
				/** @type {IQuestController} */ (this.questController),
			);
		}
		if (
			changedProperties.has("sessionService") &&
			this.sessionService != null
		) {
			this.sessionProvider.setValue(
				/** @type {ISessionService} */ (this.sessionService),
			);
		}
	}

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper-quest", TestContextWrapper);

describe("QuestView", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
		vi.clearAllMocks();
	});

	it("renders loading state when services are missing", async () => {
		const element = /** @type {QuestView} */ (
			document.createElement("quest-view")
		);
		container.appendChild(element);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("Loading services...");
	});

	it("renders no active quest when session has no quest", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(false),
				isPaused: new Signal.State(false),
				currentDialogText: new Signal.State(""),
				nextDialogText: new Signal.State(""),
				currentSlideIndex: new Signal.State(0),
				setPaused: vi.fn(),
				setShowDialog: vi.fn(),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				nextSlide: vi.fn(),
				prevSlide: vi.fn(),
				setSlideIndex: vi.fn(),
				resetSlideIndex: vi.fn(),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(null),
			})
		);
		wrapper.questController = /** @type {IQuestController} */ ({});

		const element = /** @type {QuestView} */ (
			document.createElement("quest-view")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("No active quest");
	});

	it("renders game-viewport when active quest exists", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(false),
				isPaused: new Signal.State(false),
				currentDialogText: new Signal.State(""),
				nextDialogText: new Signal.State(""),
				currentSlideIndex: new Signal.State(0),
				setPaused: vi.fn(),
				setShowDialog: vi.fn(),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				nextSlide: vi.fn(),
				prevSlide: vi.fn(),
				setSlideIndex: vi.fn(),
				resetSlideIndex: vi.fn(),
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
		wrapper.questController = /** @type {IQuestController} */ ({});

		const element = /** @type {QuestView} */ (
			document.createElement("quest-view")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const viewport = element.shadowRoot?.querySelector("game-viewport");
		expect(viewport).toBeTruthy();
	});

	it("renders victory-screen when quest is completed", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(false),
				isPaused: new Signal.State(false),
				currentDialogText: new Signal.State(""),
				nextDialogText: new Signal.State(""),
				currentSlideIndex: new Signal.State(0),
				setPaused: vi.fn(),
				setShowDialog: vi.fn(),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				nextSlide: vi.fn(),
				prevSlide: vi.fn(),
				setSlideIndex: vi.fn(),
				resetSlideIndex: vi.fn(),
			},
			quest: {
				isQuestCompleted: new Signal.State(true),
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
		wrapper.questController = /** @type {IQuestController} */ ({});

		const element = /** @type {QuestView} */ (
			document.createElement("quest-view")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const victory = element.shadowRoot?.querySelector("victory-screen");
		expect(victory).toBeTruthy();
	});

	it("renders level-dialog when showDialog is true", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(true),
				isPaused: new Signal.State(false),
				currentDialogText: new Signal.State(""),
				nextDialogText: new Signal.State(""),
				currentSlideIndex: new Signal.State(0),
				setPaused: vi.fn(),
				setShowDialog: vi.fn(),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
				nextSlide: vi.fn(),
				prevSlide: vi.fn(),
				setSlideIndex: vi.fn(),
				resetSlideIndex: vi.fn(),
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
		wrapper.questController = /** @type {IQuestController} */ ({});

		const element = /** @type {QuestView} */ (
			document.createElement("quest-view")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const dialog = element.shadowRoot?.querySelector("level-dialog");
		expect(dialog).toBeTruthy();
	});
});
