import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aiContext } from "../../contexts/ai-context.js";
import { localizationContext } from "../../contexts/localization-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { voiceContext } from "../../contexts/voice-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { GameViewport } from "./GameViewport.js";
import "./game-viewport.js";

/**
 * Test wrapper to provide contexts
 */
class TestContextWrapper extends LitElement {
	static properties = {
		heroState: { type: Object },
		questState: { type: Object },
		worldState: { type: Object },
		questController: { type: Object },
		questLoader: { type: Object },
		sessionService: { type: Object },
		localizationService: { type: Object },
		themeService: { type: Object },
		aiService: { type: Object },
		voiceSynthesisService: { type: Object },
	};

	constructor() {
		super();
		/** @type {any} */
		this.heroState = null;
		/** @type {any} */
		this.questState = null;
		/** @type {any} */
		this.worldState = null;
		/** @type {any} */
		this.questController = null;
		/** @type {any} */
		this.questLoader = null;
		/** @type {any} */
		this.sessionService = null;
		/** @type {any} */
		this.localizationService = null;
		/** @type {any} */
		this.themeService = null;
		/** @type {any} */
		this.aiService = null;
		/** @type {any} */
		this.voiceSynthesisService = null;

		/** @type {any} */
		this.heroProvider = new ContextProvider(this, {
			context: heroStateContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.questStateProvider = new ContextProvider(this, {
			context: questStateContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.worldStateProvider = new ContextProvider(this, {
			context: worldStateContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.questControllerProvider = new ContextProvider(this, {
			context: questControllerContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.questLoaderProvider = new ContextProvider(this, {
			context: questLoaderContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.sessionProvider = new ContextProvider(this, {
			context: sessionContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.localizationProvider = new ContextProvider(this, {
			context: localizationContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.themeProvider = new ContextProvider(this, {
			context: themeContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.aiProvider = new ContextProvider(this, {
			context: aiContext,
			initialValue: undefined,
		});
		/** @type {any} */
		this.voiceProvider = new ContextProvider(this, {
			context: voiceContext,
			initialValue: undefined,
		});
	}

	/** @param {import("lit").PropertyValues} changedProperties */
	updated(changedProperties) {
		if (changedProperties.has("heroState"))
			this.heroProvider.setValue(this.heroState);
		if (changedProperties.has("questState"))
			this.questStateProvider.setValue(this.questState);
		if (changedProperties.has("worldState"))
			this.worldStateProvider.setValue(this.worldState);
		if (changedProperties.has("questController"))
			this.questControllerProvider.setValue(this.questController);
		if (changedProperties.has("questLoader"))
			this.questLoaderProvider.setValue(this.questLoader);
		if (changedProperties.has("sessionService"))
			this.sessionProvider.setValue(this.sessionService);
		if (changedProperties.has("localizationService"))
			this.localizationProvider.setValue(this.localizationService);
		if (changedProperties.has("themeService"))
			this.themeProvider.setValue(this.themeService);
		if (changedProperties.has("aiService"))
			this.aiProvider.setValue(this.aiService);
		if (changedProperties.has("voiceSynthesisService"))
			this.voiceProvider.setValue(this.voiceSynthesisService);
	}

	render() {
		return html`<slot></slot>`;
	}
}

customElements.define("test-context-wrapper", TestContextWrapper);

describe("GameViewport", () => {
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

	const createHeroStateMock = () => ({
		pos: new Signal.State({ x: 0, y: 0 }),
		setImageSrc: vi.fn(),
		imageSrc: new Signal.State(""),
		isEvolving: new Signal.State(false),
		hotSwitchState: new Signal.State("legacy"),
	});

	const createQuestStateMock = () => ({
		hasCollectedItem: new Signal.State(false),
		isRewardCollected: new Signal.State(false),
		lockedMessage: new Signal.State(null),
		currentChapterNumber: new Signal.State(1),
		totalChapters: new Signal.State(10),
		levelTitle: new Signal.State("Test Level"),
		questTitle: new Signal.State("Test Quest"),
	});

	const createWorldStateMock = () => ({
		isPaused: new Signal.State(false),
		showDialog: new Signal.State(false),
	});

	const setupBasicServices = (/** @type {TestContextWrapper} */ wrapper) => {
		wrapper.questController = {
			currentChapter: { id: "ch1" },
			options: {
				logger: {
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					error: vi.fn(),
				},
			},
		};
		wrapper.heroState = createHeroStateMock();
		wrapper.questState = createQuestStateMock();
		wrapper.worldState = createWorldStateMock();
		wrapper.sessionService = {};
		wrapper.themeService = { themeMode: new Signal.State("light") };
		wrapper.aiService = {
			isEnabled: new Signal.State(false),
			checkAvailability: vi.fn().mockResolvedValue("available"),
			createSession: vi.fn().mockResolvedValue(undefined),
			getSession: vi
				.fn()
				.mockReturnValue({ prompt: vi.fn(), destroy: vi.fn() }),
			destroySession: vi.fn(),
			getChatResponse: vi.fn(),
		};
		wrapper.voiceSynthesisService = {
			speak: vi.fn(),
			cancel: vi.fn(),
		};
		wrapper.localizationService = {
			t: (/** @type {string} */ key) => key,
			getLocale: () => "en-US",
		};
	};

	it("should render initial state correctly", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);
		setupBasicServices(wrapper);

		wrapper.questController.currentChapter.backgroundStyle =
			"url('/assets/default-bg.png')";

		await wrapper.updateComplete;

		const element = document.createElement("game-viewport");
		wrapper.appendChild(element);

		await /** @type {any} */ (element).updateComplete;

		expect(element.shadowRoot?.querySelector(".game-area")).toBeTruthy();
	});

	it("should initialize controllers on update when services are ready", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		const element = document.createElement("game-viewport");
		wrapper.appendChild(element);

		// Initially not initialized
		expect(/** @type {any} */ (element)._controllersInitialized).toBe(false);

		// Provide services
		setupBasicServices(wrapper);

		await wrapper.updateComplete;
		await /** @type {any} */ (element).updateComplete;

		expect(/** @type {any} */ (element)._controllersInitialized).toBe(true);
		expect(/** @type {any} */ (element).keyboard).toBeTruthy();
	});

	it("should pass zones from current chapter to indicators", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		const zones = [
			{ type: "THEME_CHANGE", x: 10, y: 10, width: 100, height: 100 },
		];
		setupBasicServices(wrapper);
		wrapper.questController.currentChapter.zones = zones;

		await wrapper.updateComplete;

		const element = document.createElement("game-viewport");
		wrapper.appendChild(element);
		await /** @type {any} */ (element).updateComplete;

		const indicators = Array.from(
			element.shadowRoot?.querySelectorAll("game-zone-indicator") || [],
		);
		const themeIndicator = indicators.find(
			(el) => /** @type {any} */ (el).type === "THEME_CHANGE",
		);
		expect(themeIndicator).toBeTruthy();
		expect(/** @type {any} */ (themeIndicator).zones).toEqual(zones);
	});

	it("should switch to backgroundStyleReward when reward is collected", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		setupBasicServices(wrapper);
		wrapper.questController.currentChapter.backgroundStyle =
			"url('/assets/default-bg.png')";
		wrapper.questController.currentChapter.backgroundStyleReward =
			"url('/assets/reward-bg.png')";

		const questState = wrapper.questState;

		await wrapper.updateComplete;

		const element = document.createElement("game-viewport");
		wrapper.appendChild(element);
		await /** @type {any} */ (element).updateComplete;

		// Initial background
		let bg = element.shadowRoot?.querySelector(".game-area-bg");
		expect(bg?.getAttribute("src")).toContain("default-bg");

		// Collect reward
		questState.isRewardCollected.set(true);
		await /** @type {any} */ (element).updateComplete;

		bg = element.shadowRoot?.querySelector(".game-area-bg");
		expect(bg?.getAttribute("src")).toContain("reward-bg");
	});

	it("should trigger reward animation when item is collected", async () => {
		const spy = vi.spyOn(GameViewport.prototype, "startRewardAnimation");

		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);
		setupBasicServices(wrapper);

		const questState = wrapper.questState;

		await wrapper.updateComplete;

		const element = document.createElement("game-viewport");
		wrapper.appendChild(element);
		await /** @type {any} */ (element).updateComplete;

		questState.hasCollectedItem.set(true);
		await /** @type {any} */ (element).updateComplete;

		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});
});
