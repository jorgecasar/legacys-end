import { ContextProvider } from "@lit/context";
import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { CollectRewardCommand } from "../../commands/collect-reward-command.js";
import { ContinueQuestCommand } from "../../commands/continue-quest-command.js";
import { ReturnToHubCommand } from "../../commands/return-to-hub-command.js";
import { StartQuestCommand } from "../../commands/start-quest-command.js";
import { ToggleHotSwitchCommand } from "../../commands/toggle-hot-switch-command.js";
import { ROUTES } from "../../constants/routes.js";
import { themeContext } from "../../contexts/theme-context.js";
import { eventBus as centralEventBus } from "../../core/event-bus.js";
import { GameBootstrapper } from "../../core/game-bootstrapper.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { ContextMixin } from "../../mixins/context-mixin.js";
import { logger } from "../../services/logger-service.js";
import { legacysEndAppStyles } from "./LegacysEndApp.styles.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css"; // Keeping this as the instruction's snippet was malformed and didn't clearly replace it.
// Dynamic imports for code splitting:
// - game-view.js loaded when entering a quest
// - quest-hub.js loaded when in hub
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
	/** @type {Object} */
	services = {};
	/** @type {import("../../services/session-service.js").SessionService} */
	sessionService = /** @type {any} */ (null);
	/** @type {import("../../services/quest-loader-service.js").QuestLoaderService} */
	questLoader = /** @type {any} */ (null);
	/** @type {import("../../commands/command-bus.js").CommandBus} */
	commandBus = /** @type {any} */ (null);
	/** @type {import('../../core/event-bus.js').EventBus} */
	eventBus = centralEventBus;
	/** @type {import("../../services/logger-service.js").LoggerService} */
	logger = /** @type {any} */ (null);
	/** @type {import("../../services/theme-service.js").ThemeService} */
	themeService = /** @type {any} */ (null);
	/** @type {import("@lit/context").ContextProvider<any>} */
	themeProvider = /** @type {any} */ (null);
	/** @type {import("../../services/ai-service.js").AIService} */
	aiService = /** @type {any} */ (null);
	/** @type {import("../../services/voice-synthesis-service.js").VoiceSynthesisService} */
	voiceSynthesisService = /** @type {any} */ (null);
	/** @type {import('../../game/interfaces.js').IHeroStateService} */
	heroState = /** @type {any} */ (null);
	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	questState = /** @type {any} */ (null);
	/** @type {import('../../game/interfaces.js').IWorldStateService} */
	worldState = /** @type {any} */ (null);

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
		hasSeenIntro: { type: Boolean },
	};

	constructor() {
		super();
		// UI State
		this.hasSeenIntro = false;
		this.showQuestCompleteDialog = false;

		// Initialize process

		// Initialize Quest System
		// this.currentQuest = null; // Derived from signal
		// this.isInHub = false; // Derived from signal

		// Initialize Bootstrapper
		this.bootstrapper = new GameBootstrapper();
		/** @type {Promise<void>} */
		this.gameInitialized = this.initGame();

		// Track loaded components for code splitting
		/** @type {Set<string>} */
		this._loadedComponents = new Set();
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
		this.services = context.services;
		this.sessionService = context.sessionService;
		this.questLoader = context.questLoader;
		this.commandBus = context.commandBus;
		this.aiService = context.aiService;
		this.voiceSynthesisService = context.voiceSynthesisService;
		this.localizationService = context.localizationService;

		this.heroState = context.heroState;
		this.questState = context.questState;
		this.worldState = context.worldState;

		this.themeService = context.themeService;
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
		this.requestUpdate();

		// Subscribe to session manager notifications for routing

		// Controllers implicit on this, but good to keep references if needed
		// this.serviceController = context.serviceController;
		// this.characterContexts = context.characterContexts;

		/** @type {import('../../services/game-state-service').HotSwitchState} */
		this._lastHotSwitchState = null;
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
		// Initial sync (removed)

		// Always show hub on start
		// derived from sessionManager default
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
		// Delegated to ThemeService
	}

	updated(/** @type {any} */ _changedProperties) {}

	/** @type {import('../../services/game-state-service').HotSwitchState} */
	_lastHotSwitchState = null;

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		// React directly to signals
		if (this.heroState) {
			const newHotSwitchState = this.heroState.hotSwitchState.get();
			if (this._lastHotSwitchState !== newHotSwitchState) {
				this._lastHotSwitchState = newHotSwitchState;
			}
		}

		// React directly to session signals for routing
		if (this.sessionService) {
			const isInHub = this.sessionService.isInHub.get();
			const currentQuest = this.sessionService.currentQuest.get();

			// Lazy load components based on route
			this._ensureComponentLoaded(isInHub ? "quest-hub" : "quest-view");

			if (isInHub && window.location.pathname !== ROUTES.HUB) {
				this.router.navigate(ROUTES.HUB);
			} else if (currentQuest && !isInHub) {
				const chapterId = this.questController?.currentChapter?.id;
				// If we have a quest and chapter, ensure route matches
				if (chapterId) {
					const targetPath = ROUTES.CHAPTER(currentQuest.id, chapterId);
					if (window.location.pathname !== targetPath) {
						this.router.navigate(targetPath, false);
					}
				} else {
					// Just quest root? Or wait for chapter?
					const targetPath = ROUTES.QUEST(currentQuest.id);
					if (!window.location.pathname.includes(currentQuest.id)) {
						this.router.navigate(targetPath);
					}
				}
			}
		}
	}

	getChapterData(/** @type {string} */ levelId) {
		const currentQuest = this.sessionService?.currentQuest.get();
		if (!currentQuest || !currentQuest.chapters) return null;
		return currentQuest.chapters[levelId] || null;
	}

	togglePause() {
		if (this.isInHub) return;
		const isPaused = this.worldState.isPaused.get();
		this.worldState.setPaused(!isPaused);
	}

	#handleResume() {
		this.worldState.setPaused(false);
	}

	#handleRestartQuest() {
		const currentQuest = this.sessionService?.currentQuest.get();
		if (currentQuest) {
			this.questLoader.startQuest(currentQuest.id);
		}
	}

	#handleQuitToHub() {
		this.#returnToHub();
	}

	#handleCloseDialog() {
		this.worldState.setShowDialog(false);
		this.hasSeenIntro = true;
	}

	#handleToggleHotSwitch() {
		this.#executeCommand(
			new ToggleHotSwitchCommand({ heroState: this.heroState }),
			() => {
				const currentState = this.heroState.hotSwitchState.get();
				const newState = currentState === "legacy" ? "new" : "legacy";
				this.heroState.setHotSwitchState(newState);
				logger.info("🔄 Hot Switch toggled to:", newState);
			},
		);
	}

	#handleRewardCollected() {
		logger.info("🎉 LegacysEndApp received reward-collected event");
		this.#executeCommand(
			new CollectRewardCommand({ questState: this.questState }),
			() => this.questState.setIsRewardCollected(true),
		);
		this.requestUpdate();
	}

	#handleReturnToHub() {
		this.showQuestCompleteDialog = false;
		this.#returnToHub();
	}

	#handleResetProgress() {
		this.progressService.resetProgress();
		this.requestUpdate();
	}

	/**
	 * Dynamically load a component if not already loaded
	 * @param {'quest-hub' | 'quest-view'} componentName
	 */
	async _ensureComponentLoaded(componentName) {
		if (this._loadedComponents.has(componentName)) {
			return; // Already loaded
		}

		this._loadedComponents.add(componentName);

		try {
			if (componentName === "quest-hub") {
				await import("../quest-hub/quest-hub.js");
				this.logger?.info("🎯 Lazy loaded: quest-hub");
			} else if (componentName === "quest-view") {
				await import("../quest-view/quest-view.js");
				this.logger?.info("🎮 Lazy loaded: quest-view");
			}
		} catch (error) {
			this.logger?.error(`❌ Failed to load ${componentName}:`, error);
			// Remove from loaded set so it can be retried
			this._loadedComponents.delete(componentName);
		}
	}

	getActiveService() {
		// Use optional chaining as questController or currentChapter might be null during init
		const chapterId = this.questController?.currentChapter?.id;
		const chapterData = this.getChapterData(chapterId || "");
		return this.serviceController.getActiveService(
			chapterData?.serviceType,
			this.heroState.hotSwitchState.get() || null,
		);
	}

	static styles = legacysEndAppStyles;

	get isLoading() {
		return this.sessionService?.isLoading.get() || false;
	}

	get isInHub() {
		return this.sessionService?.isInHub.get() || false;
	}

	get currentQuest() {
		return this.sessionService?.currentQuest.get() || null;
	}

	render() {
		// Reactions to isLoading, isInHub, etc., happen via SignalWatcher
		const isLoading = this.sessionService?.isLoading.get() || false;
		const isInHub = this.sessionService?.isInHub.get() || false;
		// Track locale change to trigger re-render
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
				.localizationService="${this.localizationService}"
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
					questLoader: this.questLoader,
					questId,
				}),
			);
		}
		return this.questLoader.startQuest(questId);
	}

	#handleContinueQuest(/** @type {string} */ questId) {
		if (this.commandBus) {
			return this.commandBus.execute(
				new ContinueQuestCommand({
					questLoader: this.questLoader,
					questId,
				}),
			);
		}
		return this.questLoader.continueQuest(questId);
	}

	renderGame() {
		const currentQuest = this.sessionService?.currentQuest.get();
		// Fallback for chapterId: derive from controller or router?
		// Ideally QuestController is the source of truth for chapterId
		const chapterId = this.questController?.currentChapter?.id;

		const currentConfig = this.getChapterData(chapterId || "");
		if (!currentConfig) {
			return html`<div>${msg("Loading level data...")}</div>`;
		}

		const effectiveConfig = { ...currentConfig };
		const isRewardCollected = this.questState.isRewardCollected.get();
		if (isRewardCollected && currentConfig.postDialogBackgroundStyle) {
			effectiveConfig.backgroundStyle = currentConfig.postDialogBackgroundStyle;
		}

		const isCloseToTarget = this.interaction?.isCloseToNpc() || false;
		const isLastChapter = this.questController?.isLastChapter() || false;

		const gameState = {
			config: effectiveConfig,
			ui: {
				isPaused: this.worldState.isPaused.get(),
				showDialog: this.worldState.showDialog.get(),
				isQuestCompleted: this.questState.isQuestCompleted.get(),
				lockedMessage: this.questState.lockedMessage.get() || "",
			},
			quest: {
				data: currentQuest,
				chapterNumber: this.questState.currentChapterNumber.get(),
				totalChapters: this.questState.totalChapters.get(),
				isLastChapter: isLastChapter,
				levelId: chapterId,
			},
			hero: {
				pos: this.heroState.pos.get(),
				isEvolving: this.heroState.isEvolving.get(),
				hotSwitchState: this.heroState.hotSwitchState.get(),
			},
			levelState: {
				hasCollectedItem: this.questState.hasCollectedItem.get(),
				isRewardCollected: isRewardCollected,
				isCloseToTarget: isCloseToTarget,
			},
		};

		return html`
			<quest-view
				.gameState="${gameState}"
				.app="${this}"
				@resume="${() => this.#handleResume()}"
				@restart="${() => this.#handleRestartQuest()}"
				@quit="${() => this.#handleQuitToHub()}"
				@close-dialog="${() => this.#handleCloseDialog()}"
				@toggle-hot-switch="${() => this.#handleToggleHotSwitch()}"
				@reward-collected="${() => this.#handleRewardCollected()}"
				@return-to-hub="${() => this.#handleReturnToHub()}"
			></quest-view>
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
				questLoader: this.questLoader,
			}),
			() => this.questLoader.returnToHub(),
		);
	}
}
