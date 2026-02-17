/**
 * @typedef {import("../../../types/services.d.js").IQuestController} IQuestController
 * @typedef {import("../../../types/game.d.js").IQuestStateService} IQuestStateService
 * @typedef {import("./GameExitZone.js").GameExitZone} GameExitZone
 */

import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-exit-zone.js";
import axe from "axe-core";
import { questControllerContext } from "../../../contexts/quest-controller-context.js";
import { gameStoreContext } from "../../../state/game-store.js";

class TestContextWrapper extends LitElement {
	/** @override */
	static properties = {
		questController: { type: Object },
		gameStore: { type: Object },
	};

	constructor() {
		super();
		/** @type {IQuestController | undefined} */
		this.questController = undefined;
		/** @type {any} */
		this.gameStore = undefined;

		this.qcProvider = new ContextProvider(this, {
			context: questControllerContext,
		});
		this.gameStoreProvider = new ContextProvider(this, {
			context: gameStoreContext,
		});
	}

	/**
	 * @param {import("lit").PropertyValues<this>} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		if (
			changedProperties.has("questController") &&
			this.questController != null
		) {
			this.qcProvider.setValue(
				/** @type {IQuestController} */ (this.questController),
			);
		}
		if (changedProperties.has("gameStore") && this.gameStore != null) {
			this.gameStoreProvider.setValue(this.gameStore);
		}
	}

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper-exit", TestContextWrapper);

describe("GameExitZone Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders nothing when inactive", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.questController =
			/** @type {import("../../../types/services.d.js").IQuestController} */ (
				/** @type {unknown} */ ({
					currentChapter: { exitZone: null },
				})
			);
		wrapper.gameStore = {
			quest: {
				hasCollectedItem: new Signal.State(false),
			},
		};

		const element = /** @type {GameExitZone} */ (
			document.createElement("game-exit-zone")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent?.trim()).toBe("");
	});

	it("renders exit label when active", async () => {
		const config = {
			id: "exit-1",
			x: 50,
			y: 50,
			width: 10,
			height: 10,
			description: "To Next Level",
			label: "EXIT",
		};

		const wrapper = new TestContextWrapper();
		wrapper.questController =
			/** @type {import("../../../types/services.d.js").IQuestController} */ (
				/** @type {unknown} */ ({
					currentChapter: { exitZone: config },
				})
			);
		wrapper.gameStore = {
			quest: {
				hasCollectedItem: new Signal.State(true),
			},
		};

		const element = /** @type {GameExitZone} */ (
			document.createElement("game-exit-zone")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		// Wait for both wrapper and element to update
		await wrapper.updateComplete;
		await element.updateComplete;

		expect(element.shadowRoot?.innerHTML).toContain("wa-tag");
		expect(element.shadowRoot?.textContent).toContain("EXIT");
	});

	it("should have no accessibility violations", async () => {
		const config = {
			id: "exit-1",
			x: 50,
			y: 50,
			width: 10,
			height: 10,
			description: "To Next Level",
			label: "EXIT",
		};

		const wrapper = new TestContextWrapper();
		wrapper.questController =
			/** @type {import("../../../types/services.d.js").IQuestController} */ (
				/** @type {unknown} */ ({
					currentChapter: { exitZone: config },
				})
			);
		wrapper.gameStore = {
			quest: {
				hasCollectedItem: new Signal.State(true),
			},
		};

		const element = /** @type {GameExitZone} */ (
			document.createElement("game-exit-zone")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
