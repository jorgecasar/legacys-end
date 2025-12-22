import { html, LitElement } from "lit";
import { ROUTES } from "./constants/routes.js";
import { GameSessionManager } from "./managers/game-session-manager.js";
import { ContextMixin } from "./mixins/context-mixin.js";
import { GameStateService } from "./services/game-state-service.js";
import { logger } from "./services/logger-service.js";
import { ProgressService } from "./services/progress-service.js";
import { getComingSoonQuests } from "./services/quest-registry-service.js";
import { LocalStorageAdapter } from "./services/storage-service.js";
import {
	LegacyUserService,
	MockUserService,
	NewUserService,
} from "./services/user-services.js";
import { setupRoutes } from "./setup/routes.js";
import { setupCharacterContexts } from "./setup/setup-character-contexts.js";
import { setupCollision } from "./setup/setup-collision.js";
import { setupGame } from "./setup/setup-game.js";
import { setupInteraction } from "./setup/setup-interaction.js";
import { setupKeyboard } from "./setup/setup-keyboard.js";
import { setupQuest } from "./setup/setup-quest.js";
import { setupService } from "./setup/setup-service.js";
import { setupSessionManager } from "./setup/setup-session-manager.js";
import { setupVoice } from "./setup/setup-voice.js";
import { setupZones } from "./setup/setup-zones.js";
import { GameStateMapper } from "./utils/game-state-mapper.js";
import { Router } from "./utils/router.js";
import "./components/quest-hub/quest-hub.js";
import "./components/game-view/game-view.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "./pixel.css";
import { styles } from "./legacys-end-app.css.js";

/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 */

/**
 * @element legacys-end-app
 * @property {String} chapterId
 * @property {Boolean} showDialog
 * @property {Boolean} hasCollectedItem
 * @property {String} themeMode
 * @property {Object} heroPos
 * @property {String} hotSwitchState
 * @property {Boolean} isEvolving
 * @property {String} lockedMessage
 * @property {Boolean} isPaused
 * @property {Boolean} isRewardCollected
 * @property {Object} currentQuest
 * @property {Boolean} isInHub
 * @property {Boolean} hasSeenIntro
 *
 * Services (added by setupServices)
 * @property {import("./services/progress-service.js").ProgressService} progressService
 * @property {import("./services/game-state-service.js").GameStateService} gameState
 * @property {import("./services/storage-service.js").LocalStorageAdapter} storageAdapter
 * @property {import("./services/game-service.js").GameService} gameService
 * @property {Object} services
 * @property {import("./managers/game-session-manager.js").GameSessionManager} sessionManager
 *
 * Router
 * @property {import("./utils/router.js").Router} router
 *
 * Controllers (added by setupControllers)
 * @property {import("./controllers/quest-controller.js").QuestController} questController
 * @property {import("./controllers/service-controller.js").ServiceController} serviceController
 * @property {import("./controllers/character-context-controller.js").CharacterContextController} characterContexts
 * @property {import("./controllers/interaction-controller.js").InteractionController} interaction
 * @property {import("./controllers/keyboard-controller.js").KeyboardController} keyboard
 * @property {import("./controllers/game-controller.js").GameController} gameController
 * @property {import("./controllers/voice-controller.js").VoiceController} voice
 * @property {import("./controllers/game-zone-controller.js").GameZoneController} zones
 * @property {import("./controllers/collision-controller.js").CollisionController} collision
 *
 * Context Providers (added by ContextMixin)
 * @property {import("@lit/context").ContextProvider} profileProvider
 * @property {import("@lit/context").ContextProvider} themeProvider
 * @property {import("@lit/context").ContextProvider} characterProvider
 * @property {import("@lit/context").ContextProvider} suitProvider
 * @property {import("@lit/context").ContextProvider} gearProvider
 * @property {import("@lit/context").ContextProvider} powerProvider
 * @property {import("@lit/context").ContextProvider} masteryProvider
 *
 * User Data
 * @property {Object} userData
 * @property {Boolean} userLoading
 * @property {string|null} userError
 */
export class LegacysEndApp extends ContextMixin(LitElement) {
	// Services (added by setupServices)
	/** @type {import("./services/progress-service.js").ProgressService} */
	progressService;
	/** @type {import("./services/game-state-service.js").GameStateService} */
	gameState;
	/** @type {import("./services/storage-service.js").LocalStorageAdapter} */
	storageAdapter;
	/** @type {import("./services/game-service.js").GameService} */
	gameService;
	/** @type {Object} */
	services;
	/** @type {import("./managers/game-session-manager.js").GameSessionManager} */
	sessionManager;

	// Router
	/** @type {import("./utils/router.js").Router} */
	router;

	// Controllers (added by setupControllers)
	/** @type {import("./controllers/quest-controller.js").QuestController} */
	questController;
	/** @type {import("./controllers/service-controller.js").ServiceController} */
	serviceController;
	/** @type {import("./controllers/character-context-controller.js").CharacterContextController} */
	characterContexts;
	/** @type {import("./controllers/interaction-controller.js").InteractionController} */
	interaction;
	/** @type {import("./controllers/keyboard-controller.js").KeyboardController} */
	keyboard;
	/** @type {import("./controllers/game-controller.js").GameController} */
	gameController;
	/** @type {import("./controllers/voice-controller.js").VoiceController} */
	voice;
	/** @type {import("./controllers/game-zone-controller.js").GameZoneController} */
	zones;
	/** @type {import("./controllers/collision-controller.js").CollisionController} */
	collision;

	// User Data
	/** @type {Object} */
	userData;
	/** @type {Boolean} */
	userLoading;
	/** @type {string|null} */
	userError;

	// Additional providers (referenced in connectedCallback)
	// Note: These may not be properly initialized - potential bug
	/** @type {import("@lit/context").ContextProvider} */
	suitProvider;
	/** @type {import("@lit/context").ContextProvider} */
	gearProvider;
	/** @type {import("@lit/context").ContextProvider} */
	powerProvider;
	/** @type {import("@lit/context").ContextProvider} */
	masteryProvider;

	static properties = {
		chapterId: { type: String },
		showDialog: { type: Boolean },
		// State managed by GameStateService, but reflected here for rendering
		hasCollectedItem: { type: Boolean },
		themeMode: { type: String },
		heroPos: { type: Object },
		hotSwitchState: { type: String },
		isEvolving: { type: Boolean },
		lockedMessage: { type: String },
		isPaused: { type: Boolean },
		isRewardCollected: { type: Boolean },

		// Quest system properties
		currentQuest: { type: Object },
		isInHub: { type: Boolean },
		hasSeenIntro: { type: Boolean },
		isLoading: { type: Boolean },
	};

	constructor() {
		super();
		// UI State
		this.isLoading = false;
		this.showDialog = false;
		this.hasSeenIntro = false;
		this.showQuestCompleteDialog = false;

		// Initialize Services
		this.#setupServices();

		// Sync local properties with GameStateService (Observable pattern)
		this.syncState();
		this.gameState.subscribe(() => this.syncState());

		// Initialize user data state
		this.userData = null;
		this.userLoading = true;
		this.userError = null;

		// Initialize Quest System
		this.currentQuest = null;
		this.isInHub = false;

		// Initialize Router
		this.router = new Router();
		setupRoutes(this.router, this);

		// Initialize Controllers and Managers
		this.#setupControllers();
	}

	connectedCallback() {
		super.connectedCallback();

		// Update controller references to providers
		this.serviceController.options.profileProvider = this.profileProvider;
		this.characterContexts.options.suitProvider = this.suitProvider;
		this.characterContexts.options.gearProvider = this.gearProvider;
		this.characterContexts.options.powerProvider = this.powerProvider;
		this.characterContexts.options.masteryProvider = this.masteryProvider;

		this.applyTheme();
		this.serviceController.loadUserData();

		// Subscribe to session manager changes for UI updates
		this.sessionManager.subscribe((event) => {
			if (
				["state-change", "navigation", "loading", "chapter-change"].includes(
					event.type,
				)
			) {
				this.syncSessionState();
			}
		});

		// Always show hub on start
		this.isInHub = true;
	}

	firstUpdated() {
		// Start intro sequence
		setTimeout(() => {
			const introDialog = /** @type {DialogElement} */ (
				this.shadowRoot.getElementById("intro-dialog")
			);
			if (introDialog) {
				introDialog.open = true;
			}
		}, 1000);

		// Initialize Router (starts listening)
		this.router.init();

		// Default redirect if root
		if (window.location.pathname === "/" || window.location.pathname === "") {
			this.router.navigate(ROUTES.HUB, true);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
	}

	#setupServices() {
		// Initialize Services
		this.storageAdapter = new LocalStorageAdapter();
		this.gameState = new GameStateService();
		this.progressService = new ProgressService(this.storageAdapter);
		// logger is imported globally where needed

		this.services = {
			legacy: new LegacyUserService(),
			mock: new MockUserService(),
			new: new NewUserService(),
		};

		// Initialize Session Manager (after other services are ready)
		this.sessionManager = new GameSessionManager({
			gameState: this.gameState,
			progressService: this.progressService,
			// Router and questController will be set later in setupControllers/app
			router: null,
			questController: null,
			controllers: {},
		});
	}

	#setupControllers() {
		// Initialize basic input controllers
		setupKeyboard(this);
		setupGame(this);
		setupVoice(this);

		// Initialize game mechanics controllers
		setupZones(this);
		setupCollision(this);
		setupService(this);

		// Initialize context and interaction
		setupCharacterContexts(this);
		setupInteraction(this);

		// Initialize quest controller
		setupQuest(this);

		// Integrate with session manager
		setupSessionManager(this);
	}

	applyTheme() {
		this.classList.add("wa-theme-pixel");
		this.classList.add(this.themeMode === "dark" ? "wa-dark" : "wa-light");
		this.themeProvider.setValue({ themeMode: this.themeMode });
	}

	updated(changedProperties) {
		if (changedProperties.has("chapterId")) {
			// Reload user data when chapter changes (service might change)
			this.serviceController.loadUserData();
		}
		// Character context updates are handled automatically by the controller's hostUpdate() lifecycle
		// Reload user data when switching between services in Level 6
		if (changedProperties.has("hotSwitchState")) {
			this.serviceController.loadUserData();
		}
	}

	syncState() {
		const state = this.gameState.getState();
		this.heroPos = state.heroPos;
		this.hasCollectedItem = state.hasCollectedItem;
		this.isRewardCollected = state.isRewardCollected;
		this.hotSwitchState = state.hotSwitchState;
		this.isPaused = state.isPaused;
		this.isEvolving = state.isEvolving;
		this.lockedMessage = state.lockedMessage;
		this.themeMode = state.themeMode;
	}

	syncSessionState() {
		const sessionState = this.sessionManager.getGameState();
		this.isLoading = sessionState.isLoading;
		this.isInHub = sessionState.isInHub;
		this.currentQuest = sessionState.currentQuest;
		this.chapterId = sessionState.chapterId;
	}

	togglePause() {
		this.sessionManager.togglePause();
	}

	handleResume() {
		this.sessionManager.handleResume();
	}

	handleRestartQuest() {
		this.sessionManager.handleRestartQuest();
	}

	handleQuitToHub() {
		this.sessionManager.handleQuitToHub();
	}

	/**
	 * Get chapter data for current level from active quest
	 */
	getChapterData(levelId) {
		if (!this.currentQuest || !this.currentQuest.chapters) return null;
		return this.currentQuest.chapters[levelId] || null;
	}

	/**
	 * Handle keyboard interaction (Space bar)
	 * Called by KeyboardController
	 */
	handleInteract() {
		this.sessionManager.handleInteract();
	}

	/**
	 * Handle keyboard movement
	 * Called by KeyboardController
	 */
	handleMove(dx, dy) {
		this.sessionManager.handleMove(dx, dy);
	}

	triggerLevelTransition() {
		this.sessionManager.triggerLevelTransition();
	}

	getActiveService() {
		const chapterData = this.getChapterData(this.chapterId);
		return this.serviceController.getActiveService(
			chapterData?.serviceType,
			this.hotSwitchState,
		);
	}

	static styles = styles;

	render() {
		// Show hub if not in a quest
		if (this.isInHub) {
			if (this.isLoading) {
				return html`
					<div class="loading-overlay">
						<wa-spinner></wa-spinner>
						<p>Loading Quest...</p>
					</div>
					${this.renderHub()}
				`;
			}
			return html`
				${this.renderHub()}
			`;
		}

		// Show game if in a quest
		return this.renderGame();
	}

	/**
	 * Get enriched quest data for quest-hub component
	 */
	getEnrichedQuests() {
		return this.questController.getAvailableQuests().map((quest) => ({
			...quest,
			progress: this.questController.getQuestProgress(quest.id),
			isCompleted: this.questController.isQuestCompleted(quest.id),
			isLocked: !this.progressService.isQuestAvailable(quest.id),
			inProgress: this.progressService.getProgress().currentQuest === quest.id,
		}));
	}

	renderHub() {
		return html`
			<quest-hub
				.quests="${this.getEnrichedQuests()}"
				.comingSoonQuests="${getComingSoonQuests()}"
				@quest-select="${(e) => this.handleQuestSelect(e.detail.questId)}"
				@quest-continue="${(e) => this.handleContinueQuest(e.detail.questId)}"
				@reset-progress="${() => this.gameService.resetProgress()}"
			></quest-hub>
		`;
	}

	handleQuestSelect(questId) {
		return this.sessionManager.startQuest(questId);
	}

	handleContinueQuest(questId) {
		return this.sessionManager.continueQuest(questId);
	}

	renderGame() {
		const currentConfig = this.getChapterData(this.chapterId);
		if (!currentConfig) {
			return html`<div>Loading level data...</div>`;
		}

		// Handle dynamic background
		const effectiveConfig = { ...currentConfig };
		// Only change background after reward animation is complete
		if (this.isRewardCollected && currentConfig.postDialogBackgroundStyle) {
			effectiveConfig.backgroundStyle = currentConfig.postDialogBackgroundStyle;
		}

		// Dialog Config Logic
		const _dialogConfig = currentConfig;

		const gameState = GameStateMapper.map(this, effectiveConfig);

		return html`
			<game-view
				.gameState="${gameState}"
				@resume="${this.handleResume}"
				@restart="${this.handleRestartQuest}"
				@quit="${this.handleQuitToHub}"
				@complete="${() => {
					this.showDialog = false;

					// If we were showing the next chapter dialog (after reward collection),
					// advance to the next chapter
					if (
						this.isRewardCollected &&
						this.questController?.hasNextChapter()
					) {
						console.log("📖 Advancing to next chapter after preview");
						this.triggerLevelTransition();
					} else {
						// Otherwise, just mark item as collected (initial dialog completion)
						this.gameState.setCollectedItem(true);
					}
				}}"
				@close-dialog="${() => {
					this.showDialog = false;
					this.hasSeenIntro = true;
				}}"
				@toggle-hot-switch="${() => {
					const newState = this.hotSwitchState === "legacy" ? "new" : "legacy";
					this.gameState.setHotSwitchState(newState);
					logger.info("🔄 Hot Switch toggled to:", newState);
				}}"
				@reward-collected="${() => {
					logger.info("🎉 LegacysEndApp received reward-collected event");
					this.gameState.setRewardCollected(true);
					this.requestUpdate(); // Force update just in case
				}}"
				@return-to-hub="${() => {
					this.showQuestCompleteDialog = false;
					this.questController.returnToHub();
				}}"
			></game-view>
		`;
	}
}

customElements.define("legacys-end-app", LegacysEndApp);
