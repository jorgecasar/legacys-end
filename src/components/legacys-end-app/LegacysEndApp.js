import { ContextProvider } from "@lit/context";
import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ROUTES } from "../../constants/routes.js";
import { aiContext } from "../../contexts/ai-context.js";
import { localizationContext } from "../../contexts/localization-context.js";
import { progressContext } from "../../contexts/progress-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { voiceContext } from "../../contexts/voice-context.js";
import { eventBus as centralEventBus } from "../../core/event-bus.js";
import { GameBootstrapper } from "../../core/game-bootstrapper.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { ContextMixin } from "../../mixins/context-mixin.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";
import "../quest-hub/quest-hub.js";
// Dynamic import for QuestView to reduce initial bundle size
// import "../quest-view/quest-view.js";

/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 */

/**
 * @element legacys-end-app
 */
export class LegacysEndApp extends SignalWatcher(ContextMixin(LitElement)) {
	// Services
	progressService = /** @type {any} */ (null);
	storageAdapter = /** @type {any} */ (null);
	services = {};
	eventBus = centralEventBus;
	logger = /** @type {any} */ (null);
	themeProvider = /** @type {any} */ (null);
	aiService = /** @type {any} */ (null);
	voiceSynthesisService = /** @type {any} */ (null);

	// Context Providers
	progressProvider = /** @type {any} */ (null);
	questControllerProvider = /** @type {any} */ (null);
	questLoaderProvider = /** @type {any} */ (null);
	localizationProvider = /** @type {any} */ (null);
	aiProvider = /** @type {any} */ (null);
	voiceProvider = /** @type {any} */ (null);
	heroStateProvider = /** @type {any} */ (null);
	questStateProvider = /** @type {any} */ (null);
	worldStateProvider = /** @type {any} */ (null);
	sessionProvider = /** @type {any} */ (null);

	// Router
	router = /** @type {any} */ (null);

	// Controllers
	questController = /** @type {any} */ (null);
	serviceController = /** @type {any} */ (null);
	characterContexts = /** @type {any} */ (null);
	interaction = /** @type {any} */ (null);
	keyboard = /** @type {any} */ (null);
	gameController = /** @type {any} */ (null);
	voice = /** @type {any} */ (null);
	zones = /** @type {any} */ (null);
	collision = /** @type {any} */ (null);

	// Additional providers
	suitProvider = /** @type {any} */ (null);
	gearProvider = /** @type {any} */ (null);
	powerProvider = /** @type {any} */ (null);
	masteryProvider = /** @type {any} */ (null);

	static properties = {
		chapterId: { type: String },
		hasSeenIntro: { type: Boolean },
		sessionService: { state: true },
		questLoader: { state: true },
		themeService: { state: true },
		questState: { state: true },
		worldState: { state: true },
		heroState: { state: true },
		localizationService: { state: true },
	};

	constructor() {
		super();
		this.hasSeenIntro = false;
		this.showQuestCompleteDialog = false;

		this.bootstrapper = new GameBootstrapper();
		this.gameInitialized = this.initGame();

		this._loadedComponents = new Set();
	}

	async initGame() {
		const context = await this.bootstrapper.bootstrap(this);

		this.eventBus = context.eventBus;
		this.logger = context.logger;
		this.progressService = context.progressService;
		this.storageAdapter = context.storageAdapter;
		this.services = context.services;
		this.sessionService = context.sessionService;
		this.questLoader = context.questLoader;
		this.aiService = context.aiService;
		this.voiceSynthesisService = context.voiceSynthesisService;
		this.localizationService = context.localizationService;
		this.heroState = context.heroState;
		this.questState = context.questState;
		this.worldState = context.worldState;
		this.themeService = context.themeService;
		this.router = context.router;
		this.questController = context.questController;

		// Providers
		this.themeProvider = new ContextProvider(this, {
			context: themeContext,
			initialValue: this.themeService,
		});

		this.heroStateProvider = new ContextProvider(this, {
			context: heroStateContext,
			initialValue: this.heroState,
		});

		this.questStateProvider = new ContextProvider(this, {
			context: questStateContext,
			initialValue: this.questState,
		});

		this.worldStateProvider = new ContextProvider(this, {
			context: worldStateContext,
			initialValue: this.worldState,
		});

		this.progressProvider = new ContextProvider(this, {
			context: progressContext,
			initialValue: this.progressService,
		});

		this.questControllerProvider = new ContextProvider(this, {
			context: questControllerContext,
			initialValue: this.questController,
		});

		this.questLoaderProvider = new ContextProvider(this, {
			context: questLoaderContext,
			initialValue: this.questLoader,
		});

		this.localizationProvider = new ContextProvider(this, {
			context: localizationContext,
			initialValue: this.localizationService,
		});

		this.aiProvider = new ContextProvider(this, {
			context: aiContext,
			initialValue: this.aiService,
		});

		this.voiceProvider = new ContextProvider(this, {
			context: voiceContext,
			initialValue: this.voiceSynthesisService,
		});

		this.sessionProvider = new ContextProvider(this, {
			context: sessionContext,
			initialValue: this.sessionService,
		});

		this.router.init();

		if (window.location.pathname === "/" || window.location.pathname === "") {
			this.router.navigate(ROUTES.HUB, true);
		}

		this.requestUpdate();
	}

	connectedCallback() {
		super.connectedCallback();
		this.applyTheme();
	}

	firstUpdated() {
		setTimeout(() => {
			const introDialog = /** @type {DialogElement} */ (
				this.shadowRoot?.getElementById("intro-dialog")
			);
			if (introDialog) {
				introDialog.open = true;
			}
		}, 1000);
	}

	applyTheme() {
		if (!this.themeService) return;
		const theme = this.themeService.themeMode.get();
		document.documentElement.classList.toggle(
			"sl-theme-dark",
			theme === "dark",
		);
		document.documentElement.classList.toggle(
			"sl-theme-light",
			theme === "light",
		);
	}

	/**
	 * @param {import("lit").PropertyValues} _changedProperties
	 */
	willUpdate(_changedProperties) {
		super.willUpdate(_changedProperties);
		this.applyTheme();
	}

	#handleCloseDialog() {
		this.worldState?.setShowDialog(false);
		this.hasSeenIntro = true;
	}

	#handleRewardCollected() {
		this.questState?.setIsRewardCollected(true);
		this.requestUpdate();
	}

	get isLoading() {
		return this.sessionService?.isLoading.get() || false;
	}

	get isInHub() {
		return this.sessionService?.isInHub.get() || false;
	}

	render() {
		if (!this.sessionService) {
			return html`
				<div class="loading-overlay">
					<wa-spinner></wa-spinner>
					<p>${msg("Initializing Game...")}</p>
				</div>
			`;
		}

		const isLoading = this.isLoading;
		const isInHub = this.isInHub;
		this.localizationService?.getLocale();

		return html`
			<main>
				${
					isLoading
						? html`
						<div class="loading-overlay">
							<wa-spinner></wa-spinner>
							<p>${msg("Loading Quest...")}</p>
						</div>
					`
						: isInHub
							? this.renderHub()
							: this.renderGame()
				}
			</main>
		`;
	}

	getEnrichedQuests() {
		if (!this.questController) return [];
		return this.questController
			.getAvailableQuests()
			.map((/** @type {any} */ quest) => ({
				...quest,
				progress: this.questController.getQuestProgress(quest.id),
				isCompleted: this.questController.isQuestCompleted(quest.id),
				isLocked: !this.progressService.isQuestAvailable(quest.id),
				inProgress:
					this.progressService.getProgress().currentQuest === quest.id,
			}));
	}

	renderHub() {
		return html`
			<quest-hub
				.quests="${this.getEnrichedQuests()}"
				.comingSoonQuests="${this.questController?.getComingSoonQuests() || []}"
				.localizationService="${this.localizationService}"
				@quest-select="${(/** @type {CustomEvent} */ e) => this.questLoader?.startQuest(e.detail.questId)}"
				@quest-continue="${(/** @type {CustomEvent} */ e) => this.questLoader?.continueQuest(e.detail.questId)}"
				@reset-progress="${() => this.progressService.resetProgress()}"
			></quest-hub>
		`;
	}

	renderGame() {
		// Lazy load the quest view
		if (!this._loadedComponents.has("quest-view")) {
			import("../quest-view/quest-view.js").then(() => {
				this._loadedComponents.add("quest-view");
				this.requestUpdate();
			});
			return html`
				<div class="loading-overlay">
					<wa-spinner></wa-spinner>
					<p>${msg("Loading View...")}</p>
				</div>
			`;
		}

		return html`
			<quest-view
				@close-dialog="${() => this.#handleCloseDialog()}"
				@reward-collected="${() => this.#handleRewardCollected()}"
			></quest-view>
		`;
	}

	static styles = legacysEndAppStyles;
}
