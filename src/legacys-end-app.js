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
import { setupQuest } from "./setup/setup-quest.js";
import { setupSessionManager } from "./setup/setup-session-manager.js";
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
		this.isLoading = true;
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

		// Initialize movement state
		this._autoMoveRequestId = null;

		// Initialize Router
		this.router = new Router();
		setupRoutes(this.router, this);

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

		this.applyTheme();
		if (this.serviceController) {
			this.serviceController.loadUserData();
		}

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
		// Initialize quest controller (app-level navigation)
		setupQuest(this);

		// Integrate with session manager (app-level state)
		setupSessionManager(this);

		// Note: Game-specific controllers (keyboard, game, voice, zones, collision,
		// service, character contexts, interaction) are now initialized in GameView
	}

	applyTheme() {
		this.classList.add("wa-theme-pixel");
		this.classList.add(this.themeMode === "dark" ? "wa-dark" : "wa-light");
		this.themeProvider.setValue({ themeMode: this.themeMode });
	}

	updated(changedProperties) {
		if (changedProperties.has("chapterId")) {
			// Reload user data when chapter changes (service might change)
			if (this.serviceController) {
				this.serviceController.loadUserData();
			}
		}
		// Character context updates are handled automatically by the controller's hostUpdate() lifecycle
		// Reload user data when switching between services in Level 6
		if (changedProperties.has("hotSwitchState")) {
			if (this.serviceController) {
				this.serviceController.loadUserData();
			}
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

	getChapterData(levelId) {
		if (!this.currentQuest || !this.currentQuest.chapters) return null;
		return this.currentQuest.chapters[levelId] || null;
	}

	/**
	 * Handle keyboard interaction (Space bar)
	 * Called by KeyboardController
	 */
	handleInteract() {
		this.interaction.handleInteract();
	}

	/**
	 * Handle keyboard movement
	 * Called by KeyboardController
	 */
	handleMove(dx, dy, isAuto = false) {
		if (!isAuto) {
			this.stopAutoMove();
		}

		const currentConfig = this.questController?.currentChapter;
		if (!currentConfig) return;

		const state = this.gameState.getState();
		let { x, y } = state.heroPos;

		x += dx;
		y += dy;

		// Clamp to boundaries
		x = Math.max(2, Math.min(98, x));
		y = Math.max(2, Math.min(98, y));

		// Check Exit Collision
		if (this.questController?.hasExitZone()) {
			this.collision.checkExitZone(
				x,
				y,
				currentConfig.exitZone,
				state.hasCollectedItem,
			);
		}

		this.gameState.setHeroPosition(x, y);
		this.zones.checkZones(x, y);
	}

	/**
	 * Auto-move hero to target position
	 */
	moveTo(targetX, targetY, step = 0.4) {
		this.stopAutoMove();

		const move = () => {
			const state = this.gameState.getState();
			const { x, y } = state.heroPos;

			const dx = targetX - x;
			const dy = targetY - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < step) {
				this.gameState.setHeroPosition(targetX, targetY);
				this.stopAutoMove();
				return;
			}

			const moveX = (dx / distance) * step;
			const moveY = (dy / distance) * step;

			this.handleMove(moveX, moveY, true);
			this._autoMoveRequestId = requestAnimationFrame(move);
		};

		this._autoMoveRequestId = requestAnimationFrame(move);
	}

	/**
	 * Stop auto-movement
	 */
	stopAutoMove() {
		if (this._autoMoveRequestId) {
			cancelAnimationFrame(this._autoMoveRequestId);
			this._autoMoveRequestId = null;
		}
	}

	/**
	 * Trigger level transition (evolution animation + chapter completion)
	 */
	triggerLevelTransition() {
		this.stopAutoMove();
		if (this.questController?.isInQuest()) {
			this.gameState.setEvolving(true);
			setTimeout(() => {
				this.questController.completeChapter();
				this.gameState.setEvolving(false);
			}, 500);
		}
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		if (this.isInHub) return;
		const state = this.gameState.getState();
		this.gameState.setPaused(!state.isPaused);
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
		this.sessionManager.returnToHub();
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

		const gameState = GameStateMapper.map(this, effectiveConfig);

		return html`
			<game-view
				.gameState="${gameState}"
				.app="${this}"
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
