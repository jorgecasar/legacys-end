/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 * @typedef {import('../../contexts/profile-context.js').Profile} Profile
 * @typedef {import('../../services/user-api-client.js').UserApiClients} UserApiClients
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<"api-clients", UserApiClients>, import('lit').ReactiveElement>} ApiClientsContextProvider
 * @typedef {import('../../types/services.d.js').IStorageAdapter} IStorageAdapter
 * @typedef {import('../../types/services.d.js').IProgressService} IProgressService
 * @typedef {import('../../types/services.d.js').IAIService} IAIService
 * @typedef {import('../../types/services.d.js').IVoiceSynthesisService} IVoiceSynthesisService
 */

import { provide } from "@lit/context";
import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import "../quest-hub/quest-hub.js";
import "../game-viewport/game-viewport.js";
import "../pause-menu/pause-menu.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import { ROUTES } from "../../constants/routes.js";
import { aiContext } from "../../contexts/ai-context.js";
import { apiClientsContext } from "../../contexts/api-clients-context.js";
import { localizationContext } from "../../contexts/localization-context.js";
import { loggerContext } from "../../contexts/logger-context.js";
import { preloaderContext } from "../../contexts/preloader-context.js";
import { profileContext } from "../../contexts/profile-context.js";
import { progressContext } from "../../contexts/progress-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { questRegistryContext } from "../../contexts/quest-registry-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { voiceContext } from "../../contexts/voice-context.js";
import { QuestController } from "../../controllers/quest-controller.js";
import { ThemeModes } from "../../core/constants.js";
import { Router } from "../../utils/router.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";
import { GameStore, gameStoreContext } from "../../core/store.js";
import { AIService } from "../../services/ai-service.js";
import { LocalizationService } from "../../services/localization-service.js";
import { LoggerService } from "../../services/logger-service.js";
import { PreloaderService } from "../../services/preloader-service.js";
import { ProgressService } from "../../services/progress-service.js";
import { QuestRegistryService } from "../../services/quest-registry-service.js";
import { SessionService } from "../../services/session-service.js";
import { LocalStorageAdapter } from "../../services/storage-service.js";
import { ThemeService } from "../../services/theme-service.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "../../services/user-api-client.js";
import { VoiceSynthesisService } from "../../services/voice-synthesis-service.js";
import { EvaluateChapterTransitionUseCase } from "../../use-cases/evaluate-chapter-transition.js";

/**
 * @element legacys-end-app
 * @extends {LitElement}
 */
export class LegacysEndApp extends SignalWatcher(LitElement) {
	// --- Core Infrastructure ---
	// Fundamental services required by the entire application.
	@provide({ context: loggerContext })
	accessor logger = new LoggerService();

	/** @type {UserApiClients} */
	@provide({ context: apiClientsContext })
	accessor services = {};

	@provide({ context: profileContext })
	accessor profile = /** @type {Profile} */ ({ loading: true });

	// --- Application Services ---
	// Global services managing app-level features, persistence, and UI state.
	/** @type {import('../../services/session-service.js').SessionService} */
	@provide({ context: sessionContext })
	@state()
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/theme-service.js').ThemeService} */
	@provide({ context: themeContext })
	@state()
	accessor themeService =
		/** @type {import('../../services/theme-service.js').ThemeService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/localization-service.js').LocalizationService} */
	@provide({ context: localizationContext })
	@state()
	accessor localizationService =
		/** @type {import('../../services/localization-service.js').LocalizationService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {IProgressService} */
	@provide({ context: progressContext })
	accessor progressService = /** @type {IProgressService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {import('../../services/preloader-service.js').PreloaderService} */
	@provide({ context: preloaderContext })
	accessor preloaderService =
		/** @type {import('../../services/preloader-service.js').PreloaderService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */
	@provide({ context: questRegistryContext })
	accessor registry =
		/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {IAIService} */
	@provide({ context: aiContext })
	accessor aiService = /** @type {IAIService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IVoiceSynthesisService} */
	@provide({ context: voiceContext })
	accessor voiceSynthesisService = /** @type {IVoiceSynthesisService} */ (
		/** @type {unknown} */ (null)
	);

	// --- Game State (Reactive) ---
	// Domain-specific state containers for the game engine.
	/** @type {GameStore} */
	@provide({ context: gameStoreContext })
	accessor gameStore = new GameStore();

	// --- Controllers ---
	// Orchestrators that bind state, services, and UI logic.
	/** @type {import('../../controllers/quest-controller.js').QuestController} */
	@provide({ context: questControllerContext })
	accessor questController =
		/** @type {import('../../controllers/quest-controller.js').QuestController} */ (
			/** @type {unknown} */ (null)
		);

	// --- Internal Component State ---
	/** @type {import('../../utils/router.js').Router} */
	router = /** @type {import('../../utils/router.js').Router} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IStorageAdapter} */
	storage = /** @type {IStorageAdapter} */ (/** @type {unknown} */ (null));

	@state() accessor chapterId = "";
	@state() accessor hasSeenIntro = false;

	/** @type {ApiClientsContextProvider | null} */
	apiClientsProvider = null;

	constructor() {
		super();
		this.showQuestCompleteDialog = false;
		this.gameInitialized = this.initGame();
		this._loadedComponents = new Set();
	}

	async initGame() {
		this.logger.info("LegacysEndApp: Starting initialization...");

		try {
			// 1. Core Services
			this.storage = new LocalStorageAdapter({ logger: this.logger });
			this.themeService = new ThemeService({
				storage: this.storage,
				logger: this.logger,
			});
			this.registry = new QuestRegistryService();
			this.progressService = new ProgressService(
				this.storage,
				this.registry,
				this.logger,
			);
			this.localizationService = new LocalizationService({
				storage: this.storage,
				logger: this.logger,
			});

			this.localizationService.onLocaleChange(() => {
				this.registry.invalidateQuestCache();
			});

			// 2. API Services
			this.services = {
				legacy: new LegacyUserApiClient(),
				mock: new MockUserApiClient(),
				new: new NewUserApiClient(),
			};

			// 3. App Services
			this.sessionService = new SessionService();
			this.preloaderService = new PreloaderService({ logger: this.logger });
			this.aiService = new AIService({ logger: this.logger });
			this.voiceSynthesisService = new VoiceSynthesisService({
				logger: this.logger,
			});
			this.evaluateChapterTransition = new EvaluateChapterTransitionUseCase();

			// 4. Game State
			// Initialized in accessor

			// 5. Internal Utilities
			this.router = new Router(this.logger);

			// 6. Controller
			this.questController = new QuestController(this, {
				logger: this.logger,
				registry: this.registry,
				progressService: this.progressService,
				preloaderService: this.preloaderService,
				state: this.gameStore.quest,
				sessionService: this.sessionService,
				worldState: this.gameStore.world,
				heroState: this.gameStore.hero,
				router: this.router,
			});

			this.router.init();

			if (window.location.pathname === "/" || window.location.pathname === "") {
				this.router.navigate(ROUTES.HUB, true);
			}

			this.logger.info("LegacysEndApp: Initialization complete.");
			this.requestUpdate();
		} catch (error) {
			this.logger.error("LegacysEndApp: Initialization failed", error);
			throw error; // Re-throw to ensure higher-level error handling works
		}
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
		this.applyTheme();
	}

	/** @override */
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
			theme === ThemeModes.LIGHT,
		);
		document.documentElement.classList.toggle(
			"sl-theme-system",
			theme === ThemeModes.SYSTEM,
		);
	}

	/**
	 * @param {import("lit").PropertyValues} _changedProperties
	 * @override
	 */
	willUpdate(_changedProperties) {
		super.willUpdate(_changedProperties);
		this.applyTheme();
	}

	#handleCloseDialog() {
		this.gameStore.world?.setShowDialog(false);
		this.hasSeenIntro = true;
	}

	get isLoading() {
		return this.sessionService?.isLoading.get() || false;
	}

	get isInHub() {
		return this.sessionService?.isInHub.get() || false;
	}

	/** @override */
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

	/**
	 * Gets all quests with their current progress and status
	 * @returns {Array<import('../../content/quests/quest-types.js').Quest & { progress: number, isCompleted: boolean, isLocked: boolean, inProgress: boolean }>}
	 */
	getQuests() {
		if (!this.questController || !this.progressService) return [];
		const quests = this.questController.getAvailableQuests();
		return quests.map(
			(
				/** @type {import('../../content/quests/quest-types.js').Quest} */ quest,
			) => ({
				...quest,
				progress: this.questController.getQuestProgress(quest.id),
				isCompleted: this.questController.isQuestCompleted(quest.id),
				isLocked: !this.progressService.isQuestAvailable(quest.id),
				inProgress:
					this.progressService.getProgress().currentQuest === quest.id,
			}),
		);
	}

	renderHub() {
		return html`
			<quest-hub
				.quests="${this.getQuests()}"
				.comingSoonQuests="${this.questController?.getComingSoonQuests() || []}"
				.localizationService="${this.localizationService}"
				@quest-select="${(/** @type {CustomEvent} */ e) => this.questController?.startQuest(e.detail.questId)}"
				@quest-continue="${(/** @type {CustomEvent} */ e) => this.questController?.continueQuest(e.detail.questId)}"
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
				@reward-collected="${() => this.questController?.handleRewardCollected()}"
			></quest-view>
		`;
	}

	/** @override */
	static styles = legacysEndAppStyles;
}
