/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 * @typedef {import('../../contexts/profile-context.js').Profile} Profile
 * @typedef {import('../../services/user-api-client.js').UserApiClients} UserApiClients
 * @typedef {import('@lit/context').ContextProvider<import('@lit/context').Context<"api-clients", UserApiClients>, import('lit').ReactiveElement>} ApiClientsContextProvider
 * @typedef {import('../../services/storage-service.js').LocalStorageAdapter} LocalStorageAdapter
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
import { ThemeModes } from "../../core/constants.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";
import { LoggerService } from "../../services/logger-service.js";
import { BootstrapService } from "../../services/bootstrap-service.js";

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
	@provide({ context: apiClientsContext }) // This needs to match the structure defined in apiClientsContext.js
	accessor services = {};

	@provide({ context: profileContext })
	accessor profile = /** @type {Profile} */ ({ loading: true });

	// --- Application Services ---
	// Global services managing app-level features, persistence, and UI state.
	/** @type {import('../../services/session-service.js').SessionService} */ // Retain type for accessor
	@provide({ context: sessionContext })
	@state()
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {import('../../services/theme-service.js').ThemeService} */ // Retain type for accessor
	@provide({ context: themeContext })
	@state()
	accessor themeService =
		/** @type {import('../../services/theme-service.js').ThemeService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {import('../../services/localization-service.js').LocalizationService} */ // Retain type for accessor
	@provide({ context: localizationContext })
	@state()
	accessor localizationService =
		/** @type {import('../../services/localization-service.js').LocalizationService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {IProgressService} */ // Retain type for accessor
	@provide({ context: progressContext })
	accessor progressService = /** @type {IProgressService} */ (
		/** @type {unknown} */ (null)
	);
 
	/** @type {import('../../services/preloader-service.js').PreloaderService} */ // Retain type for accessor
	@provide({ context: preloaderContext })
	accessor preloaderService =
		/** @type {import('../../services/preloader-service.js').PreloaderService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */ // Retain type for accessor
	@provide({ context: questRegistryContext })
	accessor registry =
		/** @type {import('../../services/quest-registry-service.js').QuestRegistryService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {IAIService} */ // Retain type for accessor
	@provide({ context: aiContext })
	accessor aiService = /** @type {IAIService} */ (
		/** @type {unknown} */ (null)
	);
 
	/** @type {IVoiceSynthesisService} */ // Retain type for accessor
	@provide({ context: voiceContext })
	accessor voiceSynthesisService = /** @type {IVoiceSynthesisService} */ (
		/** @type {unknown} */ (null)
	);
 
	// --- Game State (Reactive) ---
	// Domain-specific state containers for the game engine. // Existing JSDoc, will move class instantiation to BootstrapService
	/** @type {import('../../game/services/quest-state-service.js').QuestStateService} */ // Retain type for accessor
	@provide({ context: questStateContext })
	@state()
	accessor questState =
		/** @type {import('../../game/services/quest-state-service.js').QuestStateService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {import('../../game/services/world-state-service.js').WorldStateService} */ // Retain type for accessor
	@provide({ context: worldStateContext })
	@state()
	accessor worldState =
		/** @type {import('../../game/services/world-state-service.js').WorldStateService} */ (
			/** @type {unknown} */ (null)
		);
 
	/** @type {import('../../game/services/hero-state-service.js').HeroStateService} */ // Retain type for accessor
	@provide({ context: heroStateContext })
	@state()
	accessor heroState =
		/** @type {import('../../game/services/hero-state-service.js').HeroStateService} */ (
			/** @type {unknown} */ (null)
		);
 
	// --- Controllers ---
	// Orchestrators that bind state, services, and UI logic. // Existing JSDoc, will move class instantiation to BootstrapService
	/** @type {import('../../controllers/quest-controller.js').QuestController} */ // Retain type for accessor
	@provide({ context: questControllerContext })
	accessor questController =
		/** @type {import('../../controllers/quest-controller.js').QuestController} */ (
			/** @type {unknown} */ (null)
		);
 
	// --- Internal Component State ---
	/** @type {import('../../utils/router.js').Router} */ // Retain type for accessor
	router = /** @type {import('../../utils/router.js').Router} */ (
		/** @type {unknown} */ (null)
	);
 
	/** @type {LocalStorageAdapter} */ // Retain type for accessor
	storage = /** @type {LocalStorageAdapter} */ (/** @type {unknown} */ (null));

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
			// The logger is already initialized as an accessor property and provided via context.
			// Pass the existing logger instance to BootstrapService.
			const bootstrapService = new BootstrapService(this.logger);
			const initializedServices = await bootstrapService.initialize(this);
 
			// Assign the initialized services and utilities to LegacysEndApp properties
			this.storage = initializedServices.storage;
			this.themeService = initializedServices.themeService;
			this.registry = initializedServices.registry;
			this.progressService = initializedServices.progressService;
			this.localizationService = initializedServices.localizationService;
			this.services = initializedServices.services;
			this.sessionService = initializedServices.sessionService;
			this.preloaderService = initializedServices.preloaderService;
			this.aiService = initializedServices.aiService;
			this.voiceSynthesisService = initializedServices.voiceSynthesisService;
			// Note: evaluateChapterTransition is a UseCase, not an accessor, so direct assignment is fine.
			this.evaluateChapterTransition = initializedServices.evaluateChapterTransition;
			this.heroState = initializedServices.heroState;
			this.questState = initializedServices.questState;
			this.worldState = initializedServices.worldState;
			this.router = initializedServices.router;
			this.questController = initializedServices.questController;

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
