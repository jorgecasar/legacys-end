import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { CollectRewardCommand } from "../../commands/collect-reward-command.js";
import { ContinueQuestCommand } from "../../commands/continue-quest-command.js";
import { ReturnToHubCommand } from "../../commands/return-to-hub-command.js";
import { StartQuestCommand } from "../../commands/start-quest-command.js";
import { ToggleHotSwitchCommand } from "../../commands/toggle-hot-switch-command.js";
import { ROUTES } from "../../constants/routes.js";
import { eventBus as centralEventBus } from "../../core/event-bus.js";
import { GameBootstrapper } from "../../core/game-bootstrapper.js";
import { ContextMixin } from "../../mixins/context-mixin.js";
import { logger } from "../../services/logger-service.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css"; // Keeping this as the instruction's snippet was malformed and didn't clearly replace it.
import "../game-view/game-view.js";
import "../quest-hub/quest-hub.js";
import "../../pixel.css";

/**
 * @typedef {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} DialogElement
 * @property {import('../../services/ai-service.js').AIService} [aiService]
 * @property {import('../../services/voice-synthesis-service.js').VoiceSynthesisService} [voiceSynthesisService]
 */

/**
 * @element legacys-end-app
 */
export class LegacysEndApp extends SignalWatcher(ContextMixin(LitElement)) {
	// Services (added by setupServices)
	// Services (added by setupServices)
	/** @type {import("../../services/progress-service.js").ProgressService} */
	progressService = /** @type {any} */ (null);
	/** @type {import("../../services/game-state-service.js").GameStateService} */
	gameState = /** @type {any} */ (null);
	/** @type {import("../../services/storage-service.js").LocalStorageAdapter} */
	storageAdapter = /** @type {any} */ (null);
	/** @type {import("../../services/game-service.js").GameService} */
	gameService = /** @type {any} */ (null);
	/** @type {Object} */
	services = {};
	/** @type {import("../../managers/game-session-manager.js").GameSessionManager} */
	sessionManager = /** @type {any} */ (null);
	/** @type {import("../../commands/command-bus.js").CommandBus} */
	commandBus = /** @type {any} */ (null);
	/** @type {import('../../core/event-bus.js').EventBus} */
	eventBus = centralEventBus;
	/** @type {import("../../services/logger-service.js").LoggerService} */
	logger = /** @type {any} */ (null);
	/** @type {import("../../services/ai-service.js").AIService} */
	aiService = /** @type {any} */ (null);
	/** @type {import("../../services/voice-synthesis-service.js").VoiceSynthesisService} */
	voiceSynthesisService = /** @type {any} */ (null);

	// Router
	/** @type {import("../../utils/router.js").Router} */
	router = /** @type {any} */ (null);

	// Controllers (added by setupControllers)
	/** @type {import("../../controllers/quest-controller.js").QuestController} */
	questController = /** @type {any} */ (null);
	/** @type {import("../../controllers/service-controller.js").ServiceController} */
	serviceController = /** @type {any} */ (null);
	/** @type {import("../../controllers/character-context-controller.js").CharacterContextController} */
	characterContexts = /** @type {any} */ (null);
	/** @type {import("../../controllers/interaction-controller.js").InteractionController} */
	interaction = /** @type {any} */ (null);
	/** @type {import("../../controllers/keyboard-controller.js").KeyboardController} */
	keyboard = /** @type {any} */ (null);
	/** @type {import("../../controllers/game-controller.js").GameController} */
	gameController = /** @type {any} */ (null);
	/** @type {import("../../controllers/voice-controller.js").VoiceController} */
	voice = /** @type {any} */ (null);
	/** @type {import("../../controllers/game-zone-controller.js").GameZoneController} */
	zones = /** @type {any} */ (null);
	/** @type {import("../../controllers/collision-controller.js").CollisionController} */
	collision = /** @type {any} */ (null);

	// User Data

	// Additional providers (referenced in connectedCallback)
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

		// Initialize process

		// Initialize Quest System
		this.currentQuest = null;
		this.isInHub = false;

		// Initialize Bootstrapper
		this.bootstrapper = new GameBootstrapper();
		/** @type {Promise<void>} */
		this.gameInitialized = this.initGame();
	}

	async initGame() {
		const context = await this.bootstrapper.bootstrap(this);

		// Map context to properties
		this.eventBus = context.eventBus;
		this.logger = context.logger;
		this.progressService =
			/** @type {import("../../services/progress-service.js").ProgressService} */ (
				context.progressService
			);
		this.gameState = context.gameState;
		this.storageAdapter = context.storageAdapter;
		this.gameService =
			/** @type {import("../../services/game-service.js").GameService} */ (
				context.gameService
			);
		this.services = context.services;
		this.sessionManager = context.sessionManager;
		this.commandBus = context.commandBus;
		this.aiService = context.aiService;
		this.voiceSynthesisService = context.voiceSynthesisService;
		this.router = /** @type {import("../../utils/router.js").Router} */ (
			context.router
		);
		this.questController =
			/** @type {import("../../controllers/quest-controller.js").QuestController} */ (
				context.questController
			);

		// Initialize Router
		this.router.init();

		// Default redirect
		if (window.location.pathname === "/" || window.location.pathname === "") {
			this.router.navigate(ROUTES.HUB, true);
		}

		// Initial sync after loading
		this.syncSessionState();
		this.requestUpdate();

		// Subscribe to session manager notifications for routing
		this.sessionManager.subscribe((/** @type {any} */ notification) =>
			this.#handleSessionNotification(notification),
		);

		// Controllers implicit on this, but good to keep references if needed
		// this.serviceController = context.serviceController;
		// this.characterContexts = context.characterContexts;

		/** @type {import('../../services/game-state-service').HotSwitchState} */
		this._lastHotSwitchState = null;
	}

	/**
	 * Handles notifications from GameSessionManager
	 * @param {any} notification
	 */
	#handleSessionNotification(notification) {
		if (notification.type === "navigation") {
			if (notification.location === "hub") {
				this.router.navigate(ROUTES.HUB);
			} else if (notification.location === "quest" && notification.questId) {
				const currentPath = window.location.pathname;
				const targetPath = ROUTES.QUEST(notification.questId);
				// Avoid redundant navigation/history entry if already there (e.g. started via URL)
				if (!currentPath.includes(notification.questId)) {
					this.router.navigate(targetPath);
				}
			}
		} else if (notification.type === "chapter-change") {
			if (notification.questId && notification.chapter?.id) {
				const targetPath = ROUTES.CHAPTER(
					notification.questId,
					notification.chapter.id,
				);
				// Avoid redundant navigation if we are already at the target chapter (e.g. detailed route load)
				if (window.location.pathname !== targetPath) {
					this.router.navigate(targetPath, false); // Push
				}
			}
		}
	}

	// Deleted #setupServices
	// Deleted #setupControllers
	// Deleted #getGameContext

	connectedCallback() {
		super.connectedCallback();

		// Update controller references to providers
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
	}

	disconnectedCallback() {
		super.disconnectedCallback();
	}

	applyTheme() {
		if (!this.gameState) return;
		const mode = this.gameState.themeMode.get();
		this.classList.add("wa-theme-pixel");
		this.classList.remove("wa-dark", "wa-light");
		this.classList.add(mode === "dark" ? "wa-dark" : "wa-light");
		this.themeProvider.setValue({ themeMode: mode });
	}

	updated(/** @type {any} */ _changedProperties) {}

	/** @type {import('../../services/game-state-service').HotSwitchState} */
	_lastHotSwitchState = null;

	/** @type {import('../../services/game-state-service.js').ThemeMode | null} */
	_lastThemeMode = null;

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		// Apply theme only when it changes
		if (!this.gameState) return;
		const newThemeMode = this.gameState.themeMode.get();
		if (this._lastThemeMode !== newThemeMode) {
			this.applyTheme();
			this._lastThemeMode = newThemeMode;
		}

		// React directly to signals
		const newHotSwitchState = this.gameState.hotSwitchState.get();
		if (this._lastHotSwitchState !== newHotSwitchState) {
			this._lastHotSwitchState = newHotSwitchState;
		}

		// Keep internal synchronous state in sync with session manager
		this.syncSessionState();
	}

	syncSessionState() {
		if (!this.sessionManager) return;
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

	togglePause() {
		if (this.isInHub) return;
		const isPaused = this.gameState.isPaused.get();
		this.gameState.setPaused(!isPaused);
	}

	#handleResume() {
		this.gameState.setPaused(false);
	}

	#handleRestartQuest() {
		if (this.currentQuest) {
			this.sessionManager.startQuest(this.currentQuest.id);
		}
	}

	#handleQuitToHub() {
		this.#returnToHub();
	}

	#handleCloseDialog() {
		this.gameState.setShowDialog(false);
		this.hasSeenIntro = true;
	}

	#handleToggleHotSwitch() {
		this.#executeCommand(
			new ToggleHotSwitchCommand({ gameState: this.gameState }),
			() => {
				const currentState = this.gameState.hotSwitchState.get();
				const newState = currentState === "legacy" ? "new" : "legacy";
				this.gameState.setHotSwitchState(newState);
				logger.info("🔄 Hot Switch toggled to:", newState);
			},
		);
	}

	#handleRewardCollected() {
		logger.info("🎉 LegacysEndApp received reward-collected event");
		this.#executeCommand(
			new CollectRewardCommand({ gameState: this.gameState }),
			() => this.gameState.setRewardCollected(true),
		);
		this.requestUpdate();
	}

	#handleReturnToHub() {
		this.showQuestCompleteDialog = false;
		this.#returnToHub();
	}

	#handleResetProgress() {
		this.gameService.resetProgress();
	}

	getActiveService() {
		const chapterData = this.getChapterData(this.chapterId || "");
		return this.serviceController.getActiveService(
			chapterData?.serviceType,
			this.gameState.hotSwitchState.get() || null,
		);
	}

	static styles = legacysEndAppStyles;

	render() {
		// Reactions to isLoading, isInHub, etc., happen via willUpdate sync
		if (this.isLoading) {
			return html`
				<div class="loading-overlay">
					<wa-spinner></wa-spinner>
					<p>Loading Quest...</p>
				</div>
			`;
		}
		if (this.isInHub) {
			return this.renderHub();
		}
		return this.renderGame();
	}

	getEnrichedQuests() {
		if (!this.questController) return [];
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
				.comingSoonQuests="${this.questController?.getComingSoonQuests() || []}"
				@quest-select="${(/** @type {CustomEvent} */ e) => this.#handleQuestSelect(e.detail.questId)}"
				@quest-continue="${(/** @type {CustomEvent} */ e) => this.#handleContinueQuest(e.detail.questId)}"
				@reset-progress="${() => this.#handleResetProgress()}"
			></quest-hub>
		`;
	}

	#handleQuestSelect(/** @type {string} */ questId) {
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

	#handleContinueQuest(/** @type {string} */ questId) {
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

		const effectiveConfig = { ...currentConfig };
		const isRewardCollected = this.gameState.isRewardCollected.get();
		if (isRewardCollected && currentConfig.postDialogBackgroundStyle) {
			effectiveConfig.backgroundStyle = currentConfig.postDialogBackgroundStyle;
		}

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
				@resume="${() => this.#handleResume()}"
				@restart="${() => this.#handleRestartQuest()}"
				@quit="${() => this.#handleQuitToHub()}"
				@close-dialog="${() => this.#handleCloseDialog()}"
				@toggle-hot-switch="${() => this.#handleToggleHotSwitch()}"
				@reward-collected="${() => this.#handleRewardCollected()}"
				@return-to-hub="${() => this.#handleReturnToHub()}"
			></game-view>
		`;
	}

	/**
	 * Executes a command if commandBus is available
	 * @param {any} command
	 * @param {Function} [fallback] - Fallback function if no commandBus
	 */
	#executeCommand(command, fallback) {
		if (this.commandBus) {
			this.commandBus.execute(command);
		} else if (fallback) {
			fallback();
		}
	}

	/**
	 * Returns to hub (shared logic)
	 */
	#returnToHub() {
		this.#executeCommand(
			new ReturnToHubCommand({
				returnToHubUseCase: this.sessionManager._returnToHubUseCase,
			}),
			() => this.sessionManager.returnToHub(),
		);
	}
}
