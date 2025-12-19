import { css, html, LitElement } from "lit";
import { ROUTES } from "./constants/routes.js";
import { ContextMixin } from "./mixins/context-mixin.js";
import { getComingSoonQuests } from "./quests/quest-registry.js";
import { logger } from "./services/logger-service.js";
import { setupControllers } from "./setup/controllers.js";
import { setupRoutes } from "./setup/routes.js";
import { setupServices } from "./setup/services.js";
import { GameStateMapper } from "./utils/game-state-mapper.js";
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

		// Initialize Services
		setupServices(this);

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
		setupControllers(this);
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
			if (["state-change", "navigation", "loading", "chapter-change"].includes(event.type)) {
				this.syncSessionState();
			}
		});

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
			this.router.navigate(ROUTES.HUB, true);
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
			this.characterContexts.update();
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

	static styles = [
		...sharedStyles,
		css`
    :host {
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
				@reset-progress="${() => this.debug.options.resetProgress()}"
				@open-about="${() =>
				this.shadowRoot.querySelector("about-slides").show()}"
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
			></game-view>
		`;
	}
}

customElements.define("legacys-end-app", LegacysEndApp);
