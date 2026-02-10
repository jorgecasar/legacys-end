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
import { storageContext } from "../../contexts/storage-context.js";
import { gameStoreContext } from "../../core/store.js";
import { BootstrapService } from "../../services/bootstrap-service.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "../../services/user-api-client.js";
import { EvaluateChapterTransitionUseCase } from "../../use-cases/evaluate-chapter-transition.js";

/**
 * @element legacys-end-app
 * @extends {LitElement}
 */
export class LegacysEndApp extends SignalWatcher(LitElement) {
	/** @type {import('../../services/logger-service.js').LoggerService} */
	@provide({ context: loggerContext })
	accessor logger =
		/** @type {import('../../services/logger-service.js').LoggerService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {UserApiClients} */
	@provide({ context: apiClientsContext })
	accessor services = {};

	/** @type {import('../../services/session-service.js').SessionService} */
	@provide({ context: sessionContext })
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/preloader-service.js').PreloaderService} */
	@provide({ context: preloaderContext })
	accessor preloader =
		/** @type {import('../../services/preloader-service.js').PreloaderService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */
	@provide({ context: questRegistryContext })
	accessor registry =
		/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {IProgressService} */
	@provide({ context: progressContext })
	accessor progressService = /** @type {IProgressService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IVoiceSynthesisService} */
	@provide({ context: voiceContext })
	accessor voiceSynthesisService = /** @type {IVoiceSynthesisService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IStorageAdapter} */
	@provide({ context: storageContext })
	accessor storage = /** @type {IStorageAdapter} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {EvaluateChapterTransitionUseCase} */
	accessor evaluateChapterTransition =
		/** @type {EvaluateChapterTransitionUseCase} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../core/store.js').GameStore} */
	@provide({ context: gameStoreContext })
	accessor gameStore = /** @type {import('../../core/store.js').GameStore} */ (
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

	/** @type {IAIService} */
	@provide({ context: aiContext })
	accessor aiService = /** @type {IAIService} */ (
		/** @type {unknown} */ (null)
	);

	// --- Controllers ---
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

	@state() accessor chapterId = "";
	@state() accessor hasSeenIntro = false;

	/** @type {ApiClientsContextProvider | null} */
	apiClientsProvider = null;

	constructor() {
		super();
		this.isMenuOpen = false;
		this.gameInitialized = this.initGame();
		this._loadedComponents = new Set();
	}

	async initGame() {
		// Logger might not be available yet if we log here before bootstrap returns
		// But in browser it might be fine to use console.
		console.info("LegacysEndApp: Starting initialization...");

		try {
			// 1. Bootstrap Core Services
			const services = await BootstrapService.init();

			// 2. Assign Services to Providers
			this.logger = services.logger;
			this.storage = services.storage;
			this.gameStore = services.gameStore;
			this.sessionService = services.session;
			this.preloader = services.preloader;
			this.registry = services.questRegistry;
			this.voiceSynthesisService = services.voiceSynthesis;
			this.progressService = services.progress;
			this.evaluateChapterTransition = services.evaluateChapterTransition;
			this.themeService = services.theme;
			this.localizationService = services.localization;
			this.aiService = services.ai;

			// 3. API Services (ProfileService)
			// ProfileService seems to not be in Bootstrap yet, let's keep it here or move it?
			// The original code had it in `this.services`.
			this.services = {
				legacy: new LegacyUserApiClient(),
				mock: new MockUserApiClient(),
				new: new NewUserApiClient(),
			};

			// 4. Setup Listeners
			this.localizationService.onLocaleChange(() => {
				this.registry.invalidateQuestCache();
			});

			// 5. Internal Utilities
			this.router = new Router(this.logger);

			// 6. Controllers
			this.questController = new QuestController(this, {
				logger: this.logger,
				registry: this.registry,
				progressService: this.progressService,
				preloaderService: this.preloader, // alias for preloader?
				state: this.gameStore.quest,
				sessionService: this.sessionService, // alias for session?
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
			console.error("LegacysEndApp: Initialization failed", error);
			// this.logger might be undefined if bootstrap failed
			throw error;
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
