import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { logger } from "../../services/logger-service.js";
import "./quest-view.js";

/** @typedef {import("../../game/interfaces.js").IHeroStateService} IHeroStateService */
/** @typedef {import("../../game/interfaces.js").IQuestStateService} IQuestStateService */
/** @typedef {import("../../game/interfaces.js").IWorldStateService} IWorldStateService */
/** @typedef {import("../../services/interfaces.js").IQuestLoaderService} IQuestLoaderService */
/** @typedef {import("../../services/interfaces.js").ISessionService} ISessionService */
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
		heroState: { type: Object },
		questState: { type: Object },
		worldState: { type: Object },
		questLoader: { type: Object },
		sessionService: { type: Object },
	};

	constructor() {
		super();
		/** @type {IHeroStateService | undefined} */
		this.heroState = undefined;
		/** @type {IQuestStateService | undefined} */
		this.questState = undefined;
		/** @type {IWorldStateService | undefined} */
		this.worldState = undefined;
		/** @type {IQuestLoaderService | undefined} */
		this.questLoader = undefined;
		/** @type {ISessionService | undefined} */
		this.sessionService = undefined;

		this.heroProvider = new ContextProvider(this, {
			context: heroStateContext,
		});
		this.questStateProvider = new ContextProvider(this, {
			context: questStateContext,
		});
		this.worldStateProvider = new ContextProvider(this, {
			context: worldStateContext,
		});
		this.qlProvider = new ContextProvider(this, {
			context: questLoaderContext,
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
		if (changedProperties.has("heroState") && this.heroState != null) {
			this.heroProvider.setValue(
				/** @type {IHeroStateService} */ (this.heroState),
			);
		}
		if (changedProperties.has("questState") && this.questState != null) {
			this.questStateProvider.setValue(
				/** @type {IQuestStateService} */ (this.questState),
			);
		}
		if (changedProperties.has("worldState") && this.worldState != null) {
			this.worldStateProvider.setValue(
				/** @type {IWorldStateService} */ (this.worldState),
			);
		}
		if (changedProperties.has("questLoader") && this.questLoader != null) {
			this.qlProvider.setValue(
				/** @type {IQuestLoaderService} */ (this.questLoader),
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
		vi.spyOn(logger, "warn").mockImplementation(() => {});
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
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				showDialog: new Signal.State(false),
			})
		);
		wrapper.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				isQuestCompleted: new Signal.State(false),
			})
		);
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(null),
			})
		);
		wrapper.heroState = /** @type {IHeroStateService} */ ({});
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});

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
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				showDialog: new Signal.State(false),
				isPaused: new Signal.State(false),
				setCurrentDialogText: vi.fn(),
			})
		);
		wrapper.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				isQuestCompleted: new Signal.State(false),
			})
		);
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);
		wrapper.heroState = /** @type {IHeroStateService} */ ({});
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});

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
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				showDialog: new Signal.State(false),
			})
		);
		wrapper.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				isQuestCompleted: new Signal.State(true),
			})
		);
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);
		wrapper.heroState = /** @type {IHeroStateService} */ ({});
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});

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
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				showDialog: new Signal.State(true),
				isPaused: new Signal.State(false),
				setCurrentDialogText: vi.fn(),
			})
		);
		wrapper.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				isQuestCompleted: new Signal.State(false),
			})
		);
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ ({ id: "q1" })),
				),
			})
		);
		wrapper.heroState = /** @type {IHeroStateService} */ ({});
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});

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
