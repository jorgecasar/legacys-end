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
import { GameBootstrapper } from "../../core/game-bootstrapper.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";
import { AIService } from "../../services/ai-service.js";
import { LoggerService } from "../../services/logger-service.js";
import { VoiceSynthesisService } from "../../services/voice-synthesis-service.js";

/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 * @typedef {import('../../contexts/character-context.js').CharacterContext} CharacterContext
 * @typedef {import('../../contexts/profile-context.js').Profile} Profile
 * @typedef {import('../../services/interfaces.js').IThemeService} IThemeService
 * @typedef {import('../../services/interfaces.js').IProgressService} IProgressService
 * @typedef {import('../../services/interfaces.js').ILoggerService} ILoggerService
 * @typedef {import('../../services/interfaces.js').IStorageAdapter} IStorageAdapter
 * @typedef {import('../../services/interfaces.js').IAIService} IAIService
 * @typedef {import('../../services/interfaces.js').IVoiceSynthesisService} IVoiceSynthesisService
 * @typedef {import('../../services/quest-registry-service.js').QuestRegistryService} QuestRegistryService
 * @typedef {import('../../services/preloader-service.js').PreloaderService} PreloaderService
 * @typedef {import('../../services/user-api-client.js').UserApiClients} UserApiClients
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<symbol, CharacterContext>, import('lit').ReactiveElement>} CharacterContextProvider
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<symbol, Profile>, import('lit').ReactiveElement>} ProfileContextProvider
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<symbol, IThemeService>, import('lit').ReactiveElement>} ThemeContextProvider
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<symbol, QuestRegistryService>, import('lit').ReactiveElement>} QuestRegistryContextProvider
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<symbol, PreloaderService>, import('lit').ReactiveElement>} PreloaderContextProvider
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<"api-clients", UserApiClients>, import('lit').ReactiveElement>} ApiClientsContextProvider
 */

/**
 * @element legacys-end-app
 * @extends {LitElement}
 */
export class LegacysEndApp extends SignalWatcher(LitElement) {
	@provide({ context: loggerContext })
	accessor logger = new LoggerService();

	// Services
	/** @type {IProgressService} */
	@provide({ context: progressContext })
	accessor progressService = /** @type {IProgressService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IStorageAdapter} */
	storage = /** @type {IStorageAdapter} */ (/** @type {unknown} */ (null));
	@provide({ context: apiClientsContext })
	accessor services = {};

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

	// Services (State + Context)
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

	/** @type {import('../../game/services/quest-state-service.js').QuestStateService} */
	@provide({ context: questStateContext })
	@state()
	accessor questState =
		/** @type {import('../../game/services/quest-state-service.js').QuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/services/world-state-service.js').WorldStateService} */
	@provide({ context: worldStateContext })
	@state()
	accessor worldState =
		/** @type {import('../../game/services/world-state-service.js').WorldStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/services/hero-state-service.js').HeroStateService} */
	@provide({ context: heroStateContext })
	@state()
	accessor heroState =
		/** @type {import('../../game/services/hero-state-service.js').HeroStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/localization-service.js').LocalizationService} */
	@provide({ context: localizationContext })
	@state()
	accessor localizationService =
		/** @type {import('../../services/localization-service.js').LocalizationService} */ (
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

	// Context Providers
	/** @type {ApiClientsContextProvider | null} */
	apiClientsProvider = null;
	// The rest of old providers are removed

	// Router
	/** @type {import('../../utils/router.js').Router} */
	router = /** @type {import('../../utils/router.js').Router} */ (
		/** @type {unknown} */ (null)
	);

	// Context items (formerly providers)
	@provide({ context: profileContext })
	accessor profile = /** @type {Profile} */ ({ loading: true });

	// Controllers
	/** @type {import('../../controllers/quest-controller.js').QuestController} */
	@provide({ context: questControllerContext })
	accessor questController =
		/** @type {import('../../controllers/quest-controller.js').QuestController} */ (
			/** @type {unknown} */ (null)
		);

	@state() accessor chapterId = "";
	@state() accessor hasSeenIntro = false;

	constructor() {
		super();
		this.showQuestCompleteDialog = false;

		this.bootstrapper = new GameBootstrapper();
		this.gameInitialized = this.initGame();

		this._loadedComponents = new Set();
	}

	async initGame() {
		const context = await this.bootstrapper.bootstrap(this, this.logger);

		this.progressService = context.progressService;
		this.storage = context.storage;
		this.services = context.services;
		this.sessionService = context.sessionService;
		this.aiService = new AIService({ logger: this.logger });
		this.voiceSynthesisService = new VoiceSynthesisService({
			logger: this.logger,
		});
		this.localizationService = context.localizationService;
		this.heroState = context.heroState;
		this.questState = context.questState;
		this.worldState = context.worldState;
		this.preloaderService = context.preloader;
		this.registry = context.registry;
		this.themeService = context.themeService;
		this.router = context.router;
		this.evaluateChapterTransition = context.evaluateChapterTransition;

		// Setup QuestController
		this.questController = new QuestController(this, {
			logger: this.logger,
			registry: this.registry,
			progressService: this.progressService,
			preloaderService: this.preloaderService,
			state: this.questState,
			sessionService: this.sessionService,
			worldState: this.worldState,
			heroState: this.heroState,
			router: this.router,
		});

		this.router.init();

		if (window.location.pathname === "/" || window.location.pathname === "") {
			this.router.navigate(ROUTES.HUB, true);
		}

		this.requestUpdate();
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
		this.worldState?.setShowDialog(false);
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
