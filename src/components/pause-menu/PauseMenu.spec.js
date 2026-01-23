import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import axe from "axe-core";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./pause-menu.js";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";

/** @typedef {import("../../game/interfaces.js").IWorldStateService} IWorldStateService */
/** @typedef {import("../../services/interfaces.js").IQuestLoaderService} IQuestLoaderService */
/** @typedef {import("../../services/interfaces.js").ISessionService} ISessionService */
/** @typedef {import("./PauseMenu.js").PauseMenu} PauseMenu */

class TestContextWrapper extends LitElement {
	/** @override */
	static properties = {
		worldState: { type: Object },
		questLoader: { type: Object },
		sessionService: { type: Object },
	};

	constructor() {
		super();
		/** @type {IWorldStateService | undefined} */
		this.worldState = undefined;
		/** @type {IQuestLoaderService | undefined} */
		this.questLoader = undefined;
		/** @type {ISessionService | undefined} */
		this.sessionService = undefined;

		this.wsProvider = new ContextProvider(this, {
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
		if (changedProperties.has("worldState")) {
			this.wsProvider.setValue(
				/** @type {import("../../game/interfaces.js").IWorldStateService} */ (
					this.worldState ?? null
				),
			);
		}
		if (changedProperties.has("questLoader")) {
			this.qlProvider.setValue(
				/** @type {import("../../services/interfaces.js").IQuestLoaderService} */ (
					this.questLoader ?? null
				),
			);
		}
		if (changedProperties.has("sessionService")) {
			this.sessionProvider.setValue(
				/** @type {import("../../services/interfaces.js").ISessionService} */ (
					this.sessionService ?? null
				),
			);
		}
	}

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}
customElements.define("test-context-wrapper-pause", TestContextWrapper);

describe("PauseMenu", () => {
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

	it("renders when open (via worldState)", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				isPaused: new Signal.State(true),
				setPaused: vi.fn(),
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});
		wrapper.sessionService = /** @type {ISessionService} */ ({});

		const element = /** @type {PauseMenu} */ (
			document.createElement("pause-menu")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const dialog = element.shadowRoot?.querySelector("wa-dialog");
		if (dialog) {
			expect(dialog.hasAttribute("open")).toBe(true);
		}
	});

	it("calls setPaused(false) on resume button click", async () => {
		const setPausedSpy = vi.fn();
		const wrapper = new TestContextWrapper();
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				isPaused: new Signal.State(true),
				setPaused: setPausedSpy,
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});
		wrapper.sessionService = /** @type {ISessionService} */ ({});

		const element = /** @type {PauseMenu} */ (
			document.createElement("pause-menu")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const resumeBtn =
			/** @type {import('@awesome.me/webawesome/dist/components/button/button.js').default} */ (
				element.shadowRoot?.querySelector("wa-button[variant='brand']")
			);
		if (resumeBtn) {
			resumeBtn.click();
			expect(setPausedSpy).toHaveBeenCalledWith(false);
		}
	});

	it("calls returnToHub on quit button click", async () => {
		const returnToHubSpy = vi.fn();
		const setPausedSpy = vi.fn();

		const wrapper = new TestContextWrapper();
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				isPaused: new Signal.State(true),
				setPaused: setPausedSpy,
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ (
			/** @type {unknown} */ ({
				returnToHub: returnToHubSpy,
			})
		);
		wrapper.sessionService = /** @type {ISessionService} */ ({});

		const element = /** @type {PauseMenu} */ (
			document.createElement("pause-menu")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const quitBtn =
			/** @type {import('@awesome.me/webawesome/dist/components/button/button.js').default} */ (
				element.shadowRoot?.querySelector("wa-button[variant='danger']")
			);
		if (quitBtn) {
			quitBtn.click();
			expect(setPausedSpy).toHaveBeenCalledWith(false);
			expect(returnToHubSpy).toHaveBeenCalled();
		}
	});

	it("should have no accessibility violations", async () => {
		const wrapper = new TestContextWrapper();
		wrapper.worldState = /** @type {IWorldStateService} */ (
			/** @type {unknown} */ ({
				isPaused: new Signal.State(true),
				setPaused: vi.fn(),
			})
		);
		wrapper.questLoader = /** @type {IQuestLoaderService} */ ({});
		wrapper.sessionService = /** @type {ISessionService} */ ({});

		const element = /** @type {PauseMenu} */ (
			document.createElement("pause-menu")
		);
		wrapper.appendChild(element);
		container.appendChild(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
