import { css, html, LitElement } from "lit";
import { CharacterContextController } from "./controllers/character-context-controller.js";
import { CollisionController } from "./controllers/collision-controller.js";
import { DebugController } from "./controllers/debug-controller.js";
import { GameZoneController } from "./controllers/game-zone-controller.js";
import { InteractionController } from "./controllers/interaction-controller.js";
import { KeyboardController } from "./controllers/keyboard-controller.js";
import { QuestController } from "./controllers/quest-controller.js";
import { ServiceController } from "./controllers/service-controller.js";
import { GameSessionManager } from "./managers/game-session-manager.js";
import { ContextMixin } from "./mixins/context-mixin.js";
import { getComingSoonQuests } from "./quests/quest-registry.js";
// Services
import { GameStateService } from "./services/game-state-service.js";
import { logger } from "./services/logger-service.js";
import { ProgressService } from "./services/progress-service.js";
import { container } from "./services/service-container.js";
import { LocalStorageAdapter } from "./services/storage-service.js";
import {
	LegacyUserService,
	MockUserService,
	NewUserService,
} from "./services/user-services.js";
import { ServiceType } from "./types.js";
import { Router } from "./utils/router.js";
import "./components/quest-hub.js";
import "./components/about-slides.js";
import "./components/game-hud.js";
import "./components/game-view.js";
import "./components/hero-profile.js";
import "./components/npc-element.js";
import "./components/reward-element.js";
import "./components/level-dialog.js";
import "./components/victory-screen.js";
import "./components/pause-menu.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "./pixel.css";
import { sharedStyles } from "./styles/shared.js";

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
 */
export class LegacysEndApp extends ContextMixin(LitElement) {
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

		// Initialize Services & Register to Container
		this.storageAdapter = new LocalStorageAdapter();
		this.gameState = new GameStateService();
		this.progressService = new ProgressService(this.storageAdapter);

		container.register("gameState", this.gameState);
		container.register("progress", this.progressService);
		container.register("logger", logger);

		this.services = {
			legacy: new LegacyUserService(),
			mock: new MockUserService(),
			new: new NewUserService(),
		};
		container.register("userServices", this.services);

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
		this.router.addRoute("/hub", () => {
			this.isInHub = true;
			this.currentQuest = null;
			this.showDialog = false;
			this.isLoading = false;
		});

		this.router.addRoute("/quest/:id", (params) => {
			const questId = params.id;
			this.isInHub = false;
			// Start quest if not already active or inconsistent
			if (!this.currentQuest || this.currentQuest.id !== questId) {
				this.questController.startQuest(questId);
			}
		});

		this.router.addRoute("/quest/:id/chapter/:chapterId", async (params) => {
			const questId = params.id;
			const chapterId = params.chapterId;
			this.isInHub = false;

			// Helper to redirect to hub
			const redirectToHub = () => {
				logger.warn(`🚫 Quest ${questId} not available. Redirecting to hub.`);
				this.router.navigate("/hub", true);
			};

			// Helper to continue quest from last available chapter
			const continueFromLastAvailable = async () => {
				logger.info(
					`📖 Continuing quest ${questId} from last available chapter...`,
				);
				await this.questController.continueQuest(questId);
			};

			// If quest not active, start it first
			if (!this.currentQuest || this.currentQuest.id !== questId) {
				// Check if quest is available before starting
				if (!this.progressService.isQuestAvailable(questId)) {
					redirectToHub();
					return;
				}

				await this.questController.startQuest(questId);

				// Now try to jump to the requested chapter
				const success = this.questController.jumpToChapter(chapterId);
				if (!success) {
					// Chapter locked or invalid, continue from last available
					await continueFromLastAvailable();
				}
			} else {
				// Quest already active, just try to jump
				const success = this.questController.jumpToChapter(chapterId);
				if (!success) {
					// Chapter locked, continue from last available
					await continueFromLastAvailable();
				}
			}
		});

		// Initialize KeyboardController
		this.keyboard = new KeyboardController(this, {
			speed: 2.5,
			onMove: (dx, dy) => this.handleMove(dx, dy),
			onInteract: () => this.handleInteract(),
			onPause: () => this.togglePause(),
			isEnabled: () =>
				!this.isEvolving && !this.showDialog && !this.isPaused && !this.isInHub,
		});

		// Initialize DebugController
		this.debug = new DebugController(this, {
			jumpToChapter: (levelId) => {
				const data = this.getChapterData(levelId);
				if (data) {
					// Use router for consistent state
					this.router.navigate(
						`/quest/${this.currentQuest?.id}/chapter/${levelId}`,
					);
				}
			},
			giveItem: () => {
				this.gameState.setCollectedItem(true);
				logger.info(`✨ Item collected!`);
			},
			teleport: (x, y) => {
				this.gameState.setHeroPosition(x, y);
				logger.info(`📍 Teleported to(${x}, ${y})`);
			},
			getState: () => ({
				level: this.chapterId,
				hasCollectedItem: this.hasCollectedItem,
				position: this.heroPos,
				themeMode: this.themeMode,
				hotSwitchState: this.hotSwitchState,
				userData: this.userData,
			}),
			setTheme: (mode) => {
				if (mode === "light" || mode === "dark") {
					this.gameState.setThemeMode(mode);
					this.applyTheme();
					logger.info(`🎨 Theme set to: ${mode} `);
				} else {
					logger.error(`❌ Invalid theme: ${mode}. Use 'light' or 'dark'`);
				}
			},
			// Quest commands
			startQuest: (questId) => {
				this.questController.startQuest(questId);
			},
			completeQuest: () => {
				if (this.questController.currentQuest) {
					this.questController.completeQuest();
				} else {
					logger.warn("⚠️ No active quest to complete");
				}
			},
			completeChapter: () => {
				if (this.questController.currentQuest) {
					this.questController.completeChapter();
				} else {
					logger.warn("⚠️ No active quest");
				}
			},
			returnToHub: () => {
				this.questController.returnToHub();
			},
			listQuests: () => {
				const available = this.questController.getAvailableQuests();
				logger.info("📋 Available Quests:");
				available.forEach((q) => {
					const progress = this.questController.getQuestProgress(q.id);
					const completed = this.questController.isQuestCompleted(q.id);
					logger.info(`  ${completed ? "✅" : "⏳"} ${q.name} (${progress}%)`);
				});
				return available;
			},
			getProgress: () => {
				return this.progressService.getProgress();
			},
			resetProgress: () => {
				this.progressService.resetProgress();
				logger.info("🔄 Progress reset");
			},
		});

		// Initialize GameZoneController
		this.zones = new GameZoneController(this, {
			onZoneEnter: (zoneId) => {
				logger.info(`Entered zone: ${zoneId}`);
			},
			onZoneExit: (zoneId) => {
				logger.info(`Exited zone: ${zoneId}`);
			},
		});

		// Initialize CollisionController
		this.collision = new CollisionController(this, {
			onExitCollision: () => this.triggerLevelTransition(),
		});

		// Initialize ServiceController
		this.serviceController = new ServiceController(this, {
			services: this.services,
			getActiveService: () => this.getActiveService(),
			onDataLoaded: (userData) => {
				this.userData = userData;
			},
			onError: (error) => {
				this.userError = error;
			},
		});

		// Initialize CharacterContextController
		this.characterContexts = new CharacterContextController(this, {
			suitProvider: null, // Will be set in connectedCallback
			gearProvider: null,
			powerProvider: null,
			masteryProvider: null,
			getState: () => ({
				level: this.chapterId,
				chapterData: this.getChapterData(this.chapterId),
				themeMode: this.themeMode,
				hotSwitchState: this.hotSwitchState,
				hasCollectedItem: this.hasCollectedItem,
				userData: this.userData,
				activeService: this.getActiveService(),
			}),
		});

		// Initialize InteractionController
		this.interaction = new InteractionController(this, {
			onShowDialog: () => {
				this.showDialog = true;
			},
			onVictory: () => {
				this.gameState.setCollectedItem(true);
				if (this.questController.currentChapter) {
					this.progressService.updateChapterState(
						this.questController.currentChapter.id,
						{ collectedItem: true },
					);
				}
			},
			onLocked: (message) => {
				this.gameState.setLockedMessage(message);
			},
			getState: () => ({
				level: this.chapterId,
				chapterData: this.getChapterData(this.chapterId),
				heroPos: this.heroPos,
				hotSwitchState: this.hotSwitchState,
				hasCollectedItem: this.hasCollectedItem,
			}),
			getNpcPosition: () => this.getChapterData(this.chapterId)?.npc?.position,
		});

		// Initialize QuestController
		this.questController = new QuestController(this, {
			progressService: this.progressService,
			onQuestStart: (quest) => {
				this.isLoading = true;
				this.currentQuest = quest;
				this.isInHub = false;
				this.showDialog = false;
				logger.info(`🎮 Started quest: ${quest.name} `);
				// Ensure URL matches
				// this.router.navigate(`/quest/${quest.id}`); // Duplicate navigation if caused by route match?
				// Better: check current route? or just replace state?
				// For now let's assume route match triggered this or user action triggered this

				// Allow a brief moment for state to settle if needed, but primarily reliance on native async
				this.isLoading = false;
			},
			onChapterChange: (chapter, index) => {
				// Map chapter to level
				this.chapterId = chapter.id;

				// Update URL to reflect chapter (without reloading)
				if (this.currentQuest) {
					this.router.navigate(
						`/quest/${this.currentQuest.id}/chapter/${chapter.id}`,
						true,
					);
				}

				// Ensure we have fresh data
				const chapterData = this.getChapterData(chapter.id);
				if (chapterData) {
					this.gameState.setHeroPosition(
						chapterData.startPos.x,
						chapterData.startPos.y,
					);

					// Set initial hotSwitchState based on ServiceType
					let initialHotSwitch = null;
					if (chapterData.serviceType === ServiceType.LEGACY) {
						initialHotSwitch = "legacy";
					} else if (chapterData.serviceType === ServiceType.MOCK) {
						initialHotSwitch = "test";
					} else if (chapterData.serviceType === ServiceType.NEW) {
						initialHotSwitch = "new";
					}
					this.gameState.setHotSwitchState(initialHotSwitch);

					// If chapter has hot switch, check zones (might override to null if outside zones)
					if (chapterData.hasHotSwitch) {
						this.zones.checkZones(
							chapterData.startPos.x,
							chapterData.startPos.y,
						);
					}
				}
				this.gameState.resetChapterState();

				// Restore state if available
				const state = this.progressService.getChapterState(chapter.id);
				if (state.collectedItem) {
					this.gameState.setCollectedItem(true);
					this.gameState.setRewardCollected(true); // Assume animation already happened if restoring state
					logger.info(
						`🔄 Restored collected item state for chapter ${chapter.id}`,
					);
				}

				logger.info(
					`📖 Chapter ${index + 1}/${chapter.total}: ${chapterData?.name || chapter.id}`,
				);
			},
			onQuestComplete: (quest) => {
				logger.info(`✅ Completed quest: ${quest.name}`);
				logger.info(`🏆 Earned badge: ${quest.reward.badge}`);
				this.showQuestCompleteDialog = true; // Show quest complete message
			},
			onReturnToHub: () => {
				this.currentQuest = null;
				logger.info(`🏛️ Returned to Hub`);
				this.router.navigate("/hub");
			},
		});

		// Initialize GameSessionManager (for future use)
		// Currently not actively used, but available for gradual migration
		this.sessionManager = new GameSessionManager({
			gameState: this.gameState,
			progressService: this.progressService,
			questController: this.questController,
			router: this.router,
			controllers: {
				keyboard: this.keyboard,
				interaction: this.interaction,
				collision: this.collision,
				zones: this.zones,
			},
		});
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

		// Always show hub on start
		this.isInHub = true;
	}

	firstUpdated() {
		// Start intro sequence
		setTimeout(() => {
			const introDialog = this.shadowRoot.getElementById("intro-dialog");
			if (introDialog) {
				introDialog.show();
			}
		}, 1000);

		// Initialize Router (starts listening)
		this.router.init();

		// Default redirect if root
		if (window.location.pathname === "/" || window.location.pathname === "") {
			this.router.navigate("/hub", true);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
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
		if (
			changedProperties.has("chapterId") ||
			changedProperties.has("hasCollectedItem") ||
			changedProperties.has("themeMode") ||
			changedProperties.has("hotSwitchState")
		) {
			this.updateContexts();
		}
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

	updateContexts() {
		if (!this.profileProvider) return; // Guard: providers not initialized yet

		// Update all character contexts via controller
		this.characterContexts.update();
	}

	togglePause() {
		if (this.isInHub) return;
		this.gameState.setPaused(!this.isPaused);
	}

	handleResume() {
		this.gameState.setPaused(false);
	}

	handleRestartQuest() {
		if (this.questController.currentQuest) {
			this.questController.startQuest(this.questController.currentQuest.id);
			this.gameState.setPaused(false);
		}
	}

	handleQuitToHub() {
		this.questController.returnToHub();
		this.gameState.setPaused(false);
	}

	/**
	 * Get chapter data for current level from active quest
	 */
	getChapterData(levelId) {
		// If in a quest, try to get chapter data from quest
		if (this.questController?.currentQuest) {
			const quest = this.questController.currentQuest;
			if (quest.chapters?.[levelId]) {
				return quest.chapters[levelId];
			}
		}
		return null;
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
	handleMove(dx, dy) {
		const currentConfig = this.getChapterData(this.chapterId);
		if (!currentConfig) return;

		let { x, y } = this.heroPos;
		x += dx;
		y += dy;

		// Clamp
		x = Math.max(2, Math.min(98, x));
		y = Math.max(2, Math.min(98, y));

		// Check Exit Collision using CollisionController
		// Only check if not in last chapter of quest
		if (this.questController?.hasExitZone()) {
			this.collision.checkExitZone(
				x,
				y,
				currentConfig.exitZone,
				this.hasCollectedItem,
			);
		}

		this.gameState.setHeroPosition(x, y);
		this.zones.checkZones(x, y);
	}

	triggerLevelTransition() {
		if (this.questController?.isInQuest()) {
			this.gameState.setEvolving(true);
			setTimeout(() => {
				this.questController.completeChapter();
				this.gameState.setEvolving(false);
			}, 500);
		}
	}

	getActiveService() {
		const chapterData = this.getChapterData(this.chapterId);
		return this.serviceController.getActiveService(
			chapterData?.serviceType,
			this.hotSwitchState,
		);
	}

	static styles = [
		...sharedStyles,
		css`
    :host {
      /* Global Pixel Theme Overrides */
      --wa-border-radius-small: 0;
      --wa-border-radius-medium: 0;
      --wa-border-radius-large: 0;
      --wa-border-radius-x-large: 0;
      --wa-border-radius-circle: 0;
      --wa-border-radius-pill: 0;
      
      /* Font Override */
      --wa-font-sans: 'Press Start 2P', monospace;

      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background-color: var(--wa-color-neutral-fill-loud);
      color: var(--wa-color-text-normal);
      position: relative;
      overflow: hidden;
      font-family: var(--wa-font-family-body);
      box-sizing: border-box;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      color: white;
    }
  `,
	];

	render() {
		// Show quest complete screen if quest is completed
		if (this.showQuestCompleteDialog) {
			return this.renderQuestComplete();
		}

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
				<about-slides></about-slides>
			`;
		}

		// Show game if in a quest
		return this.renderGame();
	}

	renderQuestComplete() {
		const quest = this.currentQuest;
		if (!quest) {
			return html`<div>Error: No quest data for completion screen.</div>`;
		}

		return html`
			<victory-screen
				.quest="${quest}"
				.onReturn="${() => {
				this.showQuestCompleteDialog = false;
				this.questController.returnToHub();
			}}"
			></victory-screen>
		`;
	}

	renderHub() {
		return html`
			<quest-hub
				.availableQuests="${this.questController.getAvailableQuests()}"
				.comingSoonQuests="${getComingSoonQuests()}"
				.currentQuestId="${this.progressService.getProgress().currentQuest}"
				.onQuestSelect="${(questId) => this.handleQuestSelect(questId)}"
				.onContinueQuest="${(questId) => this.handleContinueQuest(questId)}"
				.getQuestProgress="${(questId) =>
				this.questController.getQuestProgress(questId)}"
				.isQuestCompleted="${(questId) =>
				this.questController.isQuestCompleted(questId)}"
				.isQuestLocked="${(questId) =>
				!this.progressService.isQuestAvailable(questId)}"
				@reset-progress="${() => this.debug.options.resetProgress()}"
				@open-about="${() =>
				this.shadowRoot.querySelector("about-slides").show()}"
			></quest-hub>
		`;
	}

	handleQuestSelect(questId) {
		this.isLoading = true;
		return this.questController.startQuest(questId).finally(() => {
			this.isLoading = false;
		});
	}

	handleContinueQuest(questId) {
		this.isLoading = true;
		return this.questController.continueQuest(questId).finally(() => {
			this.isLoading = false;
		});
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

		const isCloseToTarget = this.interaction.isCloseToNpc();
		const isLastChapter = this.questController?.isLastChapter();

		// Dialog Config Logic
		const _dialogConfig = currentConfig;

		const gameState = {
			config: effectiveConfig,
			ui: {
				isPaused: this.isPaused || false,
				showDialog: this.showDialog,
				lockedMessage: this.interaction?.lockedMessage,
			},
			quest: {
				title: this.currentQuest?.name,
				chapterNumber: this.questController.getCurrentChapterNumber(),
				totalChapters: this.questController.getTotalChapters(),
				isLastChapter: isLastChapter,
				levelId: this.chapterId,
			},
			hero: {
				pos: this.heroPos || { x: 0, y: 0 },
				isEvolving: this.isEvolving || false,
				hotSwitchState: this.hotSwitchState,
			},
			levelState: {
				hasCollectedItem: this.hasCollectedItem || false,
				isRewardCollected: this.isRewardCollected || false,
				isCloseToTarget: isCloseToTarget,
			},
		};

		return html`
			<game-view
				.gameState="${gameState}"
				@resume="${this.handleResume}"
				@restart="${this.handleRestartQuest}"
				@quit="${this.handleQuitToHub}"
				@complete="${() => {
				this.showDialog = false;
				this.gameState.setCollectedItem(true);
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
			></game-view>
		`;
	}
}

customElements.define("legacys-end-app", LegacysEndApp);
