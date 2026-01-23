import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import axe from "axe-core";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./victory-screen.js";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";

/** @typedef {import("../../services/interfaces.js").ISessionService} ISessionService */
/** @typedef {import("../../services/interfaces.js").IQuestLoaderService} IQuestLoaderService */
/** @typedef {import("../../services/quest-registry-service.js").Quest} Quest */
/** @typedef {import("./VictoryScreen.js").VictoryScreen} VictoryScreen */

class TestContextWrapper extends LitElement {
	/** @override */
	static properties = {
		sessionService: { type: Object },
		questLoader: { type: Object },
	};

	constructor() {
		super();
		/** @type {ISessionService | undefined} */
		this.sessionService = undefined;
		/** @type {IQuestLoaderService | undefined} */
		this.questLoader = undefined;

		this.sessionProvider = new ContextProvider(this, {
			context: sessionContext,
		});
		this.qlProvider = new ContextProvider(this, {
			context: questLoaderContext,
		});
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		if (
			changedProperties.has("sessionService") &&
			this.sessionService != null
		) {
			this.sessionProvider?.setValue(
				/** @type {ISessionService} */ (this.sessionService),
			);
		}
		if (changedProperties.has("questLoader") && this.questLoader != null) {
			this.qlProvider?.setValue(
				/** @type {IQuestLoaderService} */ (this.questLoader),
			);
		}
	}

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper-victory", TestContextWrapper);

describe("VictoryScreen", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders quest data correctly", async () => {
		const questData = {
			name: "Epic Quest",
			color: "blue",
			reward: {
				badge: "Hero Badge",
				ability: "Super Jump",
			},
			chapters: {
				c1: { reward: { name: "Gold", image: "gold.png" } },
			},
			chapterIds: ["c1"],
		};

		const wrapper = new TestContextWrapper();
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ (questData)),
				),
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({
			returnToHub: () => Promise.resolve({ success: true }),
		});

		const element = /** @type {VictoryScreen} */ (
			document.createElement("victory-screen")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("Epic Quest");
		expect(element.shadowRoot?.textContent).toContain("Hero Badge");
		expect(element.shadowRoot?.textContent).toContain("Super Jump");
		expect(element.shadowRoot?.textContent).toContain("Gold");
	});

	it("calls onReturn when button is clicked", async () => {
		// Mock returnToHub
		let returnCalled = false;

		const questData = { name: "Quest" };

		const wrapper = new TestContextWrapper();
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ (questData)),
				),
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({
			returnToHub: () => {
				returnCalled = true;
				return Promise.resolve({ success: true });
			},
		});

		const element = /** @type {VictoryScreen} */ (
			document.createElement("victory-screen")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const btn =
			/** @type {import('@awesome.me/webawesome/dist/components/button/button.js').default} */ (
				element.shadowRoot?.querySelector("wa-button")
			);
		btn.click();

		expect(returnCalled).toBe(true);
	});

	it("should have no accessibility violations", async () => {
		const questData = {
			name: "Epic Quest",
			color: "blue",
			reward: {
				badge: "Hero Badge",
				ability: "Super Jump",
			},
			chapters: {},
			chapterIds: [],
		};

		const wrapper = new TestContextWrapper();
		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				currentQuest: new Signal.State(
					/** @type {Quest} */ (/** @type {unknown} */ (questData)),
				),
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({
			returnToHub: () => Promise.resolve({ success: true }),
		});

		const element = /** @type {VictoryScreen} */ (
			document.createElement("victory-screen")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
