import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import axe from "axe-core";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { gameStoreContext } from "../../core/store.js";
import "./level-dialog.js";

/** @typedef {import("../../types/game.d.js").IHeroStateService} IHeroStateService */
/** @typedef {import("../../types/game.d.js").IQuestStateService} IQuestStateService */
/** @typedef {import("../../types/game.d.js").IWorldStateService} IWorldStateService */
/** @typedef {import("../../types/services.d.js").IQuestController} IQuestController */
/** @typedef {import("../../types/services.d.js").ISessionService} ISessionService */
/** @typedef {import("../../services/quest-registry-service.js").Quest} Quest */
/** @typedef {import("./LevelDialog.js").LevelDialog} LevelDialog */

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

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper-level-dialog", TestContextWrapper);

describe("LevelDialog Component", () => {
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

	it("renders narrative slide first if description is present", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({
				currentChapter: { description: "Intro Narrative" },
			})
		);
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(true),
				currentSlideIndex: new Signal.State(0),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};

		const element = /** @type {LevelDialog} */ (
			document.createElement("level-dialog")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const slide = element.shadowRoot?.querySelector(
			"level-dialog-slide-narrative",
		);
		// @ts-expect-error
		await slide?.updateComplete;
		expect(slide?.shadowRoot?.textContent).toContain("Intro Narrative");
	});

	it("renders problem slide if description is missing", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({
				currentChapter: { problemDesc: "Problem Description" },
			})
		);
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(true),
				currentSlideIndex: new Signal.State(0),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};

		const element = /** @type {import("./LevelDialog.js").LevelDialog} */ (
			document.createElement("level-dialog")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const slide = element.shadowRoot?.querySelector(
			"level-dialog-slide-problem",
		);
		// @ts-expect-error
		await slide?.updateComplete;
		expect(slide?.shadowRoot?.textContent).toContain("Problem Description");
	});

	it("should have no accessibility violations", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({
				currentChapter: { description: "Intro Narrative" },
			})
		);
		wrapper.gameStore = {
			world: {
				showDialog: new Signal.State(true),
				currentSlideIndex: new Signal.State(0),
				setCurrentDialogText: vi.fn(),
				setNextDialogText: vi.fn(),
			},
			quest: {
				isQuestCompleted: new Signal.State(false),
			},
			hero: {},
		};

		const element = /** @type {LevelDialog} */ (
			document.createElement("level-dialog")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
