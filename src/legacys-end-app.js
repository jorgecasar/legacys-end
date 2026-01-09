import { SignalWatcher } from "@lit-labs/signals";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import { html, LitElement } from "lit";
import "./components/game-view/game-view.js";
import "./components/quest-hub/quest-hub.js";
import { ROUTES } from "./constants/routes.js";
import { styles } from "./legacys-end-app.css.js";
import { GameSessionManager } from "./managers/game-session-manager.js";
import { ContextMixin } from "./mixins/context-mixin.js";
import "./pixel.css";
import { CollectRewardCommand } from "./commands/collect-reward-command.js";
import { CommandBus } from "./commands/command-bus.js";
import { ContinueQuestCommand } from "./commands/continue-quest-command.js";
import {
	loggingMiddleware,
	performanceMiddleware,
	validationMiddleware,
} from "./commands/middleware.js";
import { ReturnToHubCommand } from "./commands/return-to-hub-command.js";
import { StartQuestCommand } from "./commands/start-quest-command.js";
import { ToggleHotSwitchCommand } from "./commands/toggle-hot-switch-command.js";
import { eventBus as centralEventBus } from "./core/event-bus.js";
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
import { setupGameService } from "./setup/setup-game.js";
import { setupQuest } from "./setup/setup-quest.js";
import { setupSessionManager } from "./setup/setup-session-manager.js";
import { Router } from "./utils/router.js";

/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 */

/**
 * @element legacys-end-app
 * @property {String} chapterId
 * @property {Boolean} showDialog
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
export class LegacysEndApp extends SignalWatcher(ContextMixin(LitElement)) {
	// Services (added by setupServices)
	/** @type {import("./services/progress-service.js").ProgressService} */
	progressService = /** @type {any} */ (null);
	/** @type {import("./services/game-state-service.js").GameStateService} */
	gameState = /** @type {any} */ (null);
	/** @type {import("./services/storage-service.js").LocalStorageAdapter} */
	storageAdapter = /** @type {any} */ (null);
	/** @type {import("./services/game-service.js").GameService} */
	gameService = /** @type {any} */ (null);
	/** @type {Object} */
	services = {};
	/** @type {import("./managers/game-session-manager.js").GameSessionManager} */
	sessionManager = /** @type {any} */ (null);
	/** @type {import("./commands/command-bus.js").CommandBus} */
	commandBus = /** @type {any} */ (null);
	/** @type {import('./core/event-bus.js').EventBus} */
	eventBus = centralEventBus;

	// Router
	/** @type {import("./utils/router.js").Router} */
	router = /** @type {any} */ (null);

	// Controllers (added by setupControllers)
	/** @type {import("./controllers/quest-controller.js").QuestController} */
	questController = /** @type {any} */ (null);
	/** @type {import("./controllers/service-controller.js").ServiceController} */
	serviceController = /** @type {any} */ (null);
	/** @type {import("./controllers/character-context-controller.js").CharacterContextController} */
	characterContexts = /** @type {any} */ (null);
	/** @type {import("./controllers/interaction-controller.js").InteractionController} */
	interaction = /** @type {any} */ (null);
	/** @type {import("./controllers/keyboard-controller.js").KeyboardController} */
	keyboard = /** @type {any} */ (null);
	/** @type {import("./controllers/game-controller.js").GameController} */
	gameController = /** @type {any} */ (null);
	/** @type {import("./controllers/voice-controller.js").VoiceController} */
	voice = /** @type {any} */ (null);
	/** @type {import("./controllers/game-zone-controller.js").GameZoneController} */
	zones = /** @type {any} */ (null);
	/** @type {import("./controllers/collision-controller.js").CollisionController} */
	collision = /** @type {any} */ (null);

	// User Data
	/** @type {Object} */
	userData = {};
	/** @type {Boolean} */
	userLoading = false;
	/** @type {string|null} */
	userError = null;

	// Additional providers (referenced in connectedCallback)
	// Note: These may not be properly initialized - potential bug
	/** @type {import("@lit/context").ContextProvider<any, any>} */
	suitProvider = /** @type {any} */ (null);
	/** @type {import("@lit/context").ContextProvider<any, any>} */
	gearProvider = /** @type {any} */ (null);
	/** @type {import("@lit/context").ContextProvider<any, any>} */
	powerProvider = /** @type {any} */ (null);
	/** @type {import("@lit/context").ContextProvider<any, any>} */
	masteryProvider = /** @type {any} */ (null);

	static properties = {
		chapterId: { type: String },
		// Removed duplicated properties, relying on gameState

		// Quest system properties
		currentQuest: { type: Object },
		isInHub: { type: Boolean },
		hasSeenIntro: { type: Boolean },
		isLoading: { type: Boolean },
	};

	constructor() {
		super();
		// UI State
		this.isLoading = true;
		this.hasSeenIntro = false;
		this.showQuestCompleteDialog = false;

		// Initialize Services
		this.#setupServices();

		// Sync local properties with GameStateService (Observable pattern)
		// Removed syncState, SignalWatcher handles reactivity

		// Initialize user data state
		this.userData = {};
		this.userLoading = true;
		this.userError = null;

		// Initialize Quest System
		this.currentQuest = null;
		this.isInHub = false;

		// Initialize Router
		this.router = new Router();
		setupRoutes(
			this.router,
			/** @type {any} */ ({ sessionManager: this.sessionManager }),
		);

		// Initialize Controllers and Managers
		this.#setupControllers();
	}

	connectedCallback() {
		super.connectedCallback();

		// Update controller references to providers (if controllers exist)
		// Note: Some controllers are now initialized in GameView
		if (this.serviceController) {
			this.serviceController.options.profileProvider = this.profileProvider;
		}
		if (this.characterContexts) {
			this.characterContexts.options.suitProvider = this.suitProvider;
			this.characterContexts.options.gearProvider = this.gearProvider;
			this.characterContexts.options.powerProvider = this.powerProvider;
			this.characterContexts.options.masteryProvider = this.masteryProvider;
		}

		// Initial theme application
		this.applyTheme();
		if (this.serviceController) {
			this.serviceController.loadUserData();
		}

		// Subscribe to session manager changes for UI updates
		this.sessionManager.subscribe((/** @type {any} */ event) => {
			if (
				["state-change", "navigation", "loading", "chapter-change"].includes(
					event.type,
				)
			) {
				this.syncSessionState();
				// this.syncState(); // Removed state sync
				this.requestUpdate(); // Request update to trigger render with new signal values
			}
		});

		// Listen for data loaded event (decoupled architecture)
		this.eventBus.on("data-loaded", (/** @type {any} */ data) => {
			this.userData = data;
			this.userLoading = false;
			this.userError = null;
			this.requestUpdate();
		});

		// Initial sync
		this.syncSessionState();

		// Always show hub on start
		this.isInHub = true;
	}

	firstUpdated() {
		// Start intro sequence
		setTimeout(() => {
			const introDialog = /** @type {DialogElement} */ (
				this.shadowRoot?.getElementById("intro-dialog")
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

		// Initialize Command Bus
		this.commandBus = new CommandBus();
		this.commandBus.use(validationMiddleware);
		this.commandBus.use(loggingMiddleware);
		this.commandBus.use(performanceMiddleware);

		// Initialize Session Manager (after other services are ready)
		this.sessionManager = new GameSessionManager({
			gameState: this.gameState,
			progressService: this.progressService,
			commandBus: this.commandBus,
			eventBus: this.eventBus,
			// Router and questController will be set later in setupControllers/app
			router: null,
			questController: null,
			controllers: {},
		});
	}

	#setupControllers() {
		const context = this.#getGameContext();

		// Initialize quest controller (app-level navigation)
		setupQuest(this, context);
		this.questController = /** @type {any} */ (context.questController);

		// Integrate with session manager (app-level state)
		setupSessionManager(context);

		// Initialize Game Service (Shared)
		setupGameService(context);
		this.gameService = /** @type {any} */ (context.gameService);

		// Sync manager back if needed
		this.sessionManager = context.sessionManager;
	}

	/**
	 * Create game context for dependency injection
	 * @returns {import('./core/game-context.js').IGameContext}
	 */
	#getGameContext() {
		return {
			eventBus: this.eventBus,
			gameState: this.gameState,
			commandBus: this.commandBus,
			sessionManager: this.sessionManager,
			questController: this.questController,
			progressService: this.progressService,
			gameService: this.gameService,
			router: this.router,
			serviceController: this.serviceController,
			characterContexts: this.characterContexts,
			services: this.services,
		};
	}

	applyTheme() {
		const mode = this.gameState.themeMode.get();
		this.classList.add("wa-theme-pixel");
		// Remove old theme classes first
		this.classList.remove("wa-dark", "wa-light");
		this.classList.add(mode === "dark" ? "wa-dark" : "wa-light");
		this.themeProvider.setValue({ themeMode: mode });
	}

	updated(/** @type {any} */ changedProperties) {
		if (changedProperties.has("chapterId")) {
			// Reload user data when chapter changes (service might change)
			if (this.serviceController) {
				this.serviceController.loadUserData();
			}
		}

		// Access signal to detect change for side effect (theme)
		// Ideally theme application should be in an effect or render, but side-effects in updated are okay
		// However, SignalWatcher triggers update() when accessed signals change.
		// We need to ensure we READ the signal here or rely on render reading it.
		// But applyTheme is a side effect on classList.
		// We should call applyTheme() in updated() or render().
		// Since applyTheme reads the signal, it registers dependency if called during reactive cycle?
		// No, SignalWatcher wraps `performUpdate` or `update`.

		// Let's call applyTheme every update to be safe and ensure it syncs.
		this.applyTheme();

		// Hot switch detection is handled in willUpdate
	}

	// Helper to handle hot switch side effect logic
	// We might need to store lastHotSwitchState to detect change.
	/** @type {string|null} */
	_lastHotSwitchState = null;

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		const newHotSwitchState = this.gameState.hotSwitchState.get();
		if (this._lastHotSwitchState !== newHotSwitchState) {
			if (this.serviceController) {
				this.serviceController.loadUserData();
			}
			this._lastHotSwitchState = newHotSwitchState;
		}
	}

	syncSessionState() {
		const sessionState = this.sessionManager.getGameState();
		this.isLoading = sessionState.isLoading;
		this.isInHub = sessionState.isInHub;
		this.currentQuest = sessionState.currentQuest;
		this.chapterId = sessionState.chapterId;
	}

	getChapterData(/** @type {string} */ levelId) {
		if (!this.currentQuest || !this.currentQuest.chapters) return null;
		return this.currentQuest.chapters[levelId] || null;
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		if (this.isInHub) return;
		const isPaused = this.gameState.isPaused.get();
		this.gameState.setPaused(!isPaused);
	}

	/**
	 * Handle pause menu actions
	 */
	handleResume() {
		this.gameState.setPaused(false);
	}

	handleRestartQuest() {
		if (this.currentQuest) {
			this.sessionManager.startQuest(this.currentQuest.id);
		}
	}

	handleQuitToHub() {
		if (this.commandBus) {
			this.commandBus.execute(
				new ReturnToHubCommand({
					returnToHubUseCase: this.sessionManager._returnToHubUseCase,
				}),
			);
		} else {
			this.sessionManager.returnToHub();
		}
	}

	/**
	 * Handle dialog close
	 */
	handleCloseDialog() {
		this.gameState.setShowDialog(false);
		this.hasSeenIntro = true;
	}

	/**
	 * Handle hot switch toggle
	 */
	handleToggleHotSwitch() {
		if (this.commandBus) {
			this.commandBus.execute(
				new ToggleHotSwitchCommand({ gameState: this.gameState }),
			);
		} else {
			const currentState = this.gameState.hotSwitchState.get();
			const newState = currentState === "legacy" ? "new" : "legacy";
			this.gameState.setHotSwitchState(newState);
			logger.info("🔄 Hot Switch toggled to:", newState);
		}
	}

	/**
	 * Handle reward collected
	 */
	handleRewardCollected() {
		logger.info("🎉 LegacysEndApp received reward-collected event");
		if (this.commandBus) {
			this.commandBus.execute(
				new CollectRewardCommand({ gameState: this.gameState }),
			);
		} else {
			this.gameState.setRewardCollected(true);
		}
		this.requestUpdate(); // Force update just in case
	}

	/**
	 * Handle return to hub
	 */
	handleReturnToHub() {
		this.showQuestCompleteDialog = false;
		if (this.commandBus) {
			this.commandBus.execute(
				new ReturnToHubCommand({
					returnToHubUseCase: this.sessionManager._returnToHubUseCase,
				}),
			);
		} else {
			this.questController.returnToHub();
		}
	}

	/**
	 * Handle progress reset
	 */
	handleResetProgress() {
		this.gameService.resetProgress();
	}

	getActiveService() {
		const chapterData = this.getChapterData(this.chapterId || "");
		return this.serviceController.getActiveService(
			chapterData?.serviceType,
			this.gameState.hotSwitchState.get() || null,
		);
	}

	static styles = styles;

	render() {
		if (this.isLoading) {
			return html`
				<div class="loading-overlay">
					<wa-spinner></wa-spinner>
					<p>Loading Quest...</p>
				</div>
			`;
		}
		// Show hub if not in a quest
		if (this.isInHub) {
			return this.renderHub();
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
				@quest-select="${(/** @type {CustomEvent} */ e) => this.handleQuestSelect(e.detail.questId)}"
				@quest-continue="${(/** @type {CustomEvent} */ e) => this.handleContinueQuest(e.detail.questId)}"
				@reset-progress="${() => this.handleResetProgress()}"
			></quest-hub>
		`;
	}

	handleQuestSelect(/** @type {string} */ questId) {
		if (this.commandBus) {
			return this.commandBus.execute(
				new StartQuestCommand({
					startQuestUseCase: this.sessionManager._startQuestUseCase,
					questId,
				}),
			);
		}
		return this.sessionManager.startQuest(questId);
	}

	handleContinueQuest(/** @type {string} */ questId) {
		if (this.commandBus) {
			return this.commandBus.execute(
				new ContinueQuestCommand({
					continueQuestUseCase: this.sessionManager._continueQuestUseCase,
					questId,
				}),
			);
		}
		return this.sessionManager.continueQuest(questId);
	}

	renderGame() {
		const currentConfig = this.getChapterData(this.chapterId || "");
		if (!currentConfig) {
			return html`<div>Loading level data...</div>`;
		}

		// Handle dynamic background
		const effectiveConfig = { ...currentConfig };
		// Only change background after reward animation is complete
		const isRewardCollected = this.gameState.isRewardCollected.get();
		if (isRewardCollected && currentConfig.postDialogBackgroundStyle) {
			effectiveConfig.backgroundStyle = currentConfig.postDialogBackgroundStyle;
		}

		// Construct nested state object for GameView matches expected GameState typedef
		const isCloseToTarget = this.interaction?.isCloseToNpc() || false;
		const isLastChapter = this.questController?.isLastChapter() || false;

		const stateSnapshot = this.gameState.getState();

		const gameState = {
			config: effectiveConfig,
			ui: {
				isPaused: stateSnapshot.isPaused,
				showDialog: stateSnapshot.showDialog,
				isQuestCompleted: stateSnapshot.isQuestCompleted,
				lockedMessage: stateSnapshot.lockedMessage || "",
			},
			quest: {
				data: this.currentQuest,
				chapterNumber: this.questController?.getCurrentChapterNumber() || 0,
				totalChapters: this.questController?.getTotalChapters() || 0,
				isLastChapter: isLastChapter,
				levelId: this.chapterId,
			},
			hero: {
				pos: stateSnapshot.heroPos,
				isEvolving: stateSnapshot.isEvolving,
				hotSwitchState: stateSnapshot.hotSwitchState,
			},
			levelState: {
				hasCollectedItem: stateSnapshot.hasCollectedItem,
				isRewardCollected: stateSnapshot.isRewardCollected,
				isCloseToTarget: isCloseToTarget,
			},
		};

		return html`
			<game-view
				.gameState="${gameState}"
				.app="${this}"
				@resume="${this.handleResume}"
				@restart="${this.handleRestartQuest}"
				@quit="${this.handleQuitToHub}"
				@close-dialog="${this.handleCloseDialog}"
				@toggle-hot-switch="${this.handleToggleHotSwitch}"
				@reward-collected="${this.handleRewardCollected}"
				@return-to-hub="${this.handleReturnToHub}"
			></game-view>
		`;
	}
}

customElements.define("legacys-end-app", LegacysEndApp);
