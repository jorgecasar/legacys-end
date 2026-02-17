import { ContextProvider } from "@lit/context";
import { Signal } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aiContext } from "../../contexts/ai-context.js";
import { localizationContext } from "../../contexts/localization-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { voiceContext } from "../../contexts/voice-context.js";
import {
	HotSwitchStates,
	ThemeModes,
	ZoneTypes,
} from "../../core/constants.js";
import { gameStoreContext } from "../../state/game-store.js";
import "./game-viewport.js";

/** @typedef {import('./GameViewport.js').GameViewport} GameViewport */

/** @typedef {import('../../types/game.d.js').IHeroStateService} IHeroStateService */
/** @typedef {import('../../types/game.d.js').IQuestStateService} IQuestStateService */
/** @typedef {import('../../types/game.d.js').IWorldStateService} IWorldStateService */
/** @typedef {import('../../types/services.d.js').IQuestController} IQuestController */
/** @typedef {import('../../types/services.d.js').ISessionService} ISessionService */
/** @typedef {import('../../types/services.d.js').ILocalizationService} ILocalizationService */
/** @typedef {import('../../types/services.d.js').IThemeService} IThemeService */
/** @typedef {import('../../types/services.d.js').IAIService} IAIService */
/** @typedef {import('../../types/services.d.js').IVoiceSynthesisService} IVoiceSynthesisService */

/**
 * Test wrapper to provide contexts
 */
class TestContextWrapper extends LitElement {
	/** @override */
	static properties = {
		gameStore: { type: Object },
		questController: { type: Object },
		sessionService: { type: Object },
		localizationService: { type: Object },
		themeService: { type: Object },
		aiService: { type: Object },
		voiceSynthesisService: { type: Object },
	};

	constructor() {
		super();
		/** @type {any} */
		this.gameStore = undefined;
		/** @type {IQuestController | undefined} */
		this.questController = undefined;
		/** @type {ISessionService | undefined} */
		this.sessionService = undefined;
		/** @type {ILocalizationService | undefined} */
		this.localizationService = undefined;
		/** @type {IThemeService | undefined} */
		this.themeService = undefined;
		/** @type {IAIService | undefined} */
		this.aiService = undefined;
		/** @type {IVoiceSynthesisService | undefined} */
		this.voiceSynthesisService = undefined;

		this.gameStoreProvider = new ContextProvider(this, {
			context: gameStoreContext,
		});
		this.questControllerProvider = new ContextProvider(this, {
			context: questControllerContext,
		});
		this.sessionProvider = new ContextProvider(this, {
			context: sessionContext,
		});
		this.localizationProvider = new ContextProvider(this, {
			context: localizationContext,
		});
		this.themeProvider = new ContextProvider(this, { context: themeContext });
		this.aiProvider = new ContextProvider(this, { context: aiContext });
		this.voiceProvider = new ContextProvider(this, { context: voiceContext });
	}

	/**
	 * @param {import("lit").PropertyValues<this>} changedProperties
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
			this.questControllerProvider.setValue(
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
		if (
			changedProperties.has("localizationService") &&
			this.localizationService != null
		) {
			this.localizationProvider.setValue(
				/** @type {ILocalizationService} */ (this.localizationService),
			);
		}
		if (changedProperties.has("themeService") && this.themeService != null) {
			this.themeProvider.setValue(
				/** @type {IThemeService} */ (this.themeService),
			);
		}
		if (changedProperties.has("aiService") && this.aiService != null) {
			this.aiProvider.setValue(/** @type {IAIService} */ (this.aiService));
		}
		if (
			changedProperties.has("voiceSynthesisService") &&
			this.voiceSynthesisService != null
		) {
			this.voiceProvider.setValue(
				/** @type {IVoiceSynthesisService} */ (this.voiceSynthesisService),
			);
		}
	}

	/** @override */
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

	/** @returns {IHeroStateService} */
	const createHeroStateMock = () => {
		const pos = new Signal.State({ x: 0, y: 0 });
		const imageSrc = new Signal.State("");
		const isEvolving = new Signal.State(false);
		const hotSwitchState = new Signal.State(
			/** @type {import('../../types/game.d.js').HotSwitchState} */ (
				HotSwitchStates.LEGACY
			),
		);

		return {
			pos,
			imageSrc,
			isEvolving: { get: vi.fn(() => isEvolving.get()) },
			hotSwitchState: { get: vi.fn(() => hotSwitchState.get()) },
			setPos: vi.fn((p) => pos.set(p)),
			setImageSrc: vi.fn((s) => imageSrc.set(s)),
			setIsEvolving: vi.fn((e) => isEvolving.set(e)),
			setHotSwitchState: vi.fn((h) => hotSwitchState.set(h)),
		};
	};

	/** @returns {IQuestStateService} */
	const createQuestStateMock = () => {
		const hasCollectedItem = new Signal.State(false);
		const isRewardCollected = new Signal.State(false);
		const isQuestCompleted = new Signal.State(false);
		const lockedMessage = new Signal.State(/** @type {string|null} */ (null));
		const currentChapterNumber = new Signal.State(1);
		const totalChapters = new Signal.State(10);
		const levelTitle = new Signal.State("Test Level");
		const questTitle = new Signal.State("Test Quest");
		const currentChapterId = new Signal.State(
			/** @type {string|null} */ (null),
		);

		return {
			hasCollectedItem: { get: vi.fn(() => hasCollectedItem.get()) },
			isRewardCollected: { get: vi.fn(() => isRewardCollected.get()) },
			isQuestCompleted: { get: vi.fn(() => isQuestCompleted.get()) },
			lockedMessage: { get: vi.fn(() => lockedMessage.get()) },
			currentChapterNumber: { get: vi.fn(() => currentChapterNumber.get()) },
			totalChapters: { get: vi.fn(() => totalChapters.get()) },
			levelTitle: { get: vi.fn(() => levelTitle.get()) },
			questTitle: { get: vi.fn(() => questTitle.get()) },
			currentChapterId: { get: vi.fn(() => currentChapterId.get()) },
			setHasCollectedItem: vi.fn((v) => hasCollectedItem.set(v)),
			setIsRewardCollected: vi.fn((v) => isRewardCollected.set(v)),
			setIsQuestCompleted: vi.fn((v) => isQuestCompleted.set(v)),
			setLockedMessage: vi.fn((m) => lockedMessage.set(m)),
			setCurrentChapterNumber: vi.fn((n) => currentChapterNumber.set(n)),
			setTotalChapters: vi.fn((n) => totalChapters.set(n)),
			setLevelTitle: vi.fn((t) => levelTitle.set(t)),
			setQuestTitle: vi.fn((t) => questTitle.set(t)),
			setCurrentChapterId: vi.fn((id) => currentChapterId.set(id)),
			resetChapterState: vi.fn(),
			resetQuestState: vi.fn(),
		};
	};

	/** @returns {IWorldStateService} */
	const createWorldStateMock = () => {
		const isPaused = new Signal.State(false);
		const showDialog = new Signal.State(false);
		const currentDialogText = new Signal.State("");
		const nextDialogText = new Signal.State("");
		const currentSlideIndex = new Signal.State(0);

		return {
			isPaused,
			showDialog,
			currentDialogText,
			nextDialogText,
			currentSlideIndex,
			setPaused: vi.fn((v) => isPaused.set(v)),
			setShowDialog: vi.fn((v) => showDialog.set(v)),
			setCurrentDialogText: vi.fn((t) => currentDialogText.set(t)),
			setNextDialogText: vi.fn((t) => nextDialogText.set(t)),
			nextSlide: vi.fn(() =>
				currentSlideIndex.set(currentSlideIndex.get() + 1),
			),
			prevSlide: vi.fn(() =>
				currentSlideIndex.set(Math.max(currentSlideIndex.get() - 1, 0)),
			),
			setSlideIndex: vi.fn((i) => currentSlideIndex.set(i)),
			resetSlideIndex: vi.fn(() => currentSlideIndex.set(0)),
			resetWorldState: vi.fn(),
		};
	};

	const setupBasicServices = (/** @type {TestContextWrapper} */ wrapper) => {
		wrapper.questController = /** @type {IQuestController} */ (
			/** @type {unknown} */ ({
				currentChapter: {
					id: "ch1",
					title: "Chapter 1",
					description: "Desc",
					problemTitle: "Problem",
					problemDesc: "Problem Desc",
					startPos: { x: 0, y: 0 },
				},
				options: {
					logger: {
						info: vi.fn(),
						warn: vi.fn(),
						debug: vi.fn(),
						error: vi.fn(),
					},
				},
			})
		);

		wrapper.gameStore = {
			hero: createHeroStateMock(),
			quest: createQuestStateMock(),
			world: createWorldStateMock(),
		};

		wrapper.sessionService = /** @type {ISessionService} */ (
			/** @type {unknown} */ ({
				isLoading: new Signal.State(false),
				isInHub: new Signal.State(false),
				currentQuest: new Signal.State(null),
			})
		);
		wrapper.themeService = /** @type {IThemeService} */ (
			/** @type {unknown} */ ({
				themeMode: new Signal.State(ThemeModes.LIGHT),
			})
		);
		wrapper.aiService = /** @type {IAIService} */ (
			/** @type {unknown} */ ({
				isEnabled: new Signal.State(false),
				checkAvailability: vi.fn().mockResolvedValue("available"),
				createSession: vi.fn().mockResolvedValue(undefined),
				getSession: vi
					.fn()
					.mockReturnValue({ prompt: vi.fn(), destroy: vi.fn() }),
				destroySession: vi.fn(),
				getChatResponse: vi.fn(),
			})
		);
		wrapper.voiceSynthesisService = /** @type {IVoiceSynthesisService} */ (
			/** @type {unknown} */ ({
				speak: vi.fn(),
				cancel: vi.fn(),
			})
		);
		wrapper.localizationService =
			/** @type {import('../../types/services.d.js').ILocalizationService} */ (
				/** @type {unknown} */ ({
					t: (/** @type {string} */ key) => key,
					getLocale: () => "en-US",
				})
			);
	};

	it("should render initial state correctly", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);
		setupBasicServices(wrapper);

		if (wrapper.questController?.currentChapter) {
			wrapper.questController.currentChapter.backgroundStyle =
				"url('/assets/default-bg.png')";
		}

		await wrapper.updateComplete;

		const element = /** @type {GameViewport} */ (
			document.createElement("game-viewport")
		);
		wrapper.appendChild(element);

		await element.updateComplete;

		expect(element.shadowRoot?.querySelector(".game-area")).toBeTruthy();
	});

	it("should initialize controllers on update when services are ready", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		const element = /** @type {GameViewport} */ (
			document.createElement("game-viewport")
		);
		wrapper.appendChild(element);

		// Initially not initialized
		expect(element._controllersInitialized).toBe(false);

		// Provide services
		setupBasicServices(wrapper);

		await wrapper.updateComplete;
		await element.updateComplete;

		expect(element._controllersInitialized).toBe(true);
	});

	it("should pass zones from current chapter to indicators", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		/** @type {import('../../content/quests/quest-types.js').Chapter['zones']} */
		const zones = [
			/** @type {import('../../content/quests/quest-types.js').Zone} */ (
				/** @type {unknown} */ ({
					type: ZoneTypes.THEME_CHANGE, // Changed logic to match expectation
					payload: HotSwitchStates.LEGACY,
					x: 10,
					y: 10,
					width: 100,
					height: 100,
				})
			),
		];
		setupBasicServices(wrapper);
		if (wrapper.questController?.currentChapter) {
			wrapper.questController.currentChapter.zones = zones;
		}

		await wrapper.updateComplete;

		const element = /** @type {GameViewport} */ (
			document.createElement("game-viewport")
		);
		wrapper.appendChild(element);
		await element.updateComplete;

		const indicators = Array.from(
			element.shadowRoot?.querySelectorAll("game-zone-indicator") || [],
		);
		const themeIndicator = indicators.find(
			(el) => el.type === ZoneTypes.THEME_CHANGE,
		);

		expect(themeIndicator).toBeTruthy();
		expect(themeIndicator?.zones).toEqual(zones);
	});

	it("should switch to backgroundStyleReward when reward is collected", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);

		setupBasicServices(wrapper);
		if (wrapper.questController?.currentChapter) {
			wrapper.questController.currentChapter.backgroundStyle =
				"url('/assets/default-bg.png')";
			wrapper.questController.currentChapter.backgroundStyleReward =
				"url('/assets/reward-bg.png')";
		}

		const questState = wrapper.gameStore.quest;

		await wrapper.updateComplete;

		const element = /** @type {GameViewport} */ (
			document.createElement("game-viewport")
		);
		wrapper.appendChild(element);
		await element.updateComplete;

		// Initial background
		let bg = element.shadowRoot?.querySelector(".game-area-bg");
		expect(bg?.getAttribute("src")).toContain("default-bg");

		// Collect reward
		questState?.setIsRewardCollected(true);
		await element.updateComplete;

		bg = element.shadowRoot?.querySelector(".game-area-bg");
		expect(bg?.getAttribute("src")).toContain("reward-bg");
	});

	it("should trigger reward animation when item is collected", async () => {
		const wrapper = new TestContextWrapper();
		container.appendChild(wrapper);
		setupBasicServices(wrapper);

		const questState = wrapper.gameStore.quest;

		await wrapper.updateComplete;

		const element = /** @type {GameViewport} */ (
			document.createElement("game-viewport")
		);

		// Spy on the method of this specific instance after it is created but before connected
		// But element methods might be bound or standard literal class methods.
		// `startRewardAnimation` is a method on the class.
		// If we spy on prototype, we cover it.
		// If we want to spy on instance, we can do it here.
		const spy = vi.spyOn(element, "startRewardAnimation");

		wrapper.appendChild(element);
		await element.updateComplete;

		questState?.setHasCollectedItem(true);
		await element.updateComplete;

		expect(spy).toHaveBeenCalled();
	});
});
