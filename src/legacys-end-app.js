import { LitElement, html, css } from 'lit';
import { ContextProvider } from '@lit/context';
import { profileContext } from './contexts/profile-context.js';
import { themeContext } from './contexts/theme-context.js';
import { suitContext } from './contexts/suit-context.js';
import { gearContext } from './contexts/gear-context.js';
import { powerContext } from './contexts/power-context.js';
import { masteryContext } from './contexts/mastery-context.js';
import { ServiceType } from './types.js';
import { LegacyUserService, MockUserService, NewUserService } from './services/userServices.js';
import { KeyboardController } from './controllers/keyboard-controller.js';
import { DebugController } from './controllers/debug-controller.js';
import { GameZoneController } from './controllers/game-zone-controller.js';
import { CharacterContextController } from './controllers/character-context-controller.js';
import { CollisionController } from './controllers/collision-controller.js';
import { ServiceController } from './controllers/service-controller.js';
import { InteractionController } from './controllers/interaction-controller.js';
import { QuestController } from './controllers/quest-controller.js';
import { ProgressService } from './services/progress-service.js';
import { GameStateService } from './services/game-state-service.js';
import { getComingSoonQuests } from './quests/quest-registry.js';
import './components/quest-hub.js';
import './components/about-slides.js';
import './components/game-hud.js';
import './components/game-view.js';
import './components/hero-profile.js';
import './components/npc-element.js';
import './components/reward-element.js';
import './components/level-dialog.js';
import './components/victory-screen.js';
import './components/pause-menu.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './pixel.css';
import { sharedStyles } from './styles/shared.js';

export class LegacysEndApp extends LitElement {
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
		hasSeenIntro: { type: Boolean }
	};

	constructor() {
		super();
		// UI State
		this.showDialog = false;
		this.hasSeenIntro = false;
		this.showQuestCompleteDialog = false;

		// Initialize Services
		this.gameState = new GameStateService();
		this.progressService = new ProgressService();

		this.services = {
			legacy: new LegacyUserService(),
			mock: new MockUserService(),
			new: new NewUserService(),
		};

		// Sync local properties with GameStateService
		this.syncState();
		this.gameState.subscribe(() => this.syncState());

		// Initialize user data state
		this.userData = null;
		this.userLoading = true;
		this.userError = null;

		// Initialize Quest System
		this.currentQuest = null;
		this.isInHub = false;

		// Initialize KeyboardController
		this.keyboard = new KeyboardController(this, {
			speed: 2.5,
			onMove: (dx, dy) => this.handleMove(dx, dy),
			onInteract: () => this.handleInteract(),
			onPause: () => this.togglePause(),
			isEnabled: () => !this.isEvolving && !this.showDialog && !this.isPaused && !this.isInHub
		});

		// Initialize DebugController
		this.debug = new DebugController(this, {
			setLevel: (levelId) => {
				// Refactored to accept ID or try to find it
				if (levelId) {
					this.chapterId = levelId;
					const data = this.getChapterData(levelId);
					if (data) {
						this.gameState.setHeroPosition(data.startPos.x, data.startPos.y);
						console.log(`🎮 Jumped to Chapter ${levelId}`);
					}
				}
			},
			giveItem: () => {
				this.gameState.setCollectedItem(true);
				console.log(`✨ Item collected!`);
			},
			teleport: (x, y) => {
				this.gameState.setHeroPosition(x, y);
				console.log(`📍 Teleported to (${x}, ${y})`);
			},
			getState: () => ({
				level: this.chapterId,
				hasCollectedItem: this.hasCollectedItem,
				position: this.heroPos,
				themeMode: this.themeMode,
				hotSwitchState: this.hotSwitchState,
				userData: this.userData
			}),
			setTheme: (mode) => {
				if (mode === 'light' || mode === 'dark') {
					this.gameState.setThemeMode(mode);
					this.applyTheme();
					console.log(`🎨 Theme set to: ${mode}`);
				} else {
					console.error(`❌ Invalid theme: ${mode}. Use 'light' or 'dark'`);
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
					console.warn('⚠️ No active quest to complete');
				}
			},
			completeChapter: () => {
				if (this.questController.currentQuest) {
					this.questController.completeChapter();
				} else {
					console.warn('⚠️ No active quest');
				}
			},
			returnToHub: () => {
				this.questController.returnToHub();
			},
			listQuests: () => {
				const available = this.questController.getAvailableQuests();
				console.log('📋 Available Quests:');
				available.forEach(q => {
					const progress = this.questController.getQuestProgress(q.id);
					const completed = this.questController.isQuestCompleted(q.id);
					console.log(`  ${completed ? '✅' : '⏳'} ${q.name} (${progress}%)`);
				});
				return available;
			},
			getProgress: () => {
				return this.progressService.getProgress();
			},
			resetProgress: () => {
				this.questController.resetProgress();
			}
		});

		// Initialize GameZoneController
		this.zones = new GameZoneController(this, {
			onThemeChange: (theme) => {
				this.gameState.setThemeMode(theme);
			},
			onContextChange: (context) => {
				if (this.hotSwitchState !== context) {
					this.gameState.setHotSwitchState(context);
				}
			},
			getChapterData: () => this.getChapterData(this.chapterId),
			hasCollectedItem: () => this.hasCollectedItem
		});

		// Initialize CollisionController
		this.collision = new CollisionController(this, {
			onExitCollision: () => this.triggerLevelTransition()
		});

		// Initialize ServiceController
		this.serviceController = new ServiceController(this, {
			services: this.services,
			getActiveService: () => this.getActiveService(),
			onDataLoaded: (userData) => { this.userData = userData; },
			onError: (error) => { this.userError = error; }
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
				activeService: this.getActiveService()
			})
		});

		// Initialize InteractionController
		this.interaction = new InteractionController(this, {
			onShowDialog: () => { this.showDialog = true; },
			onVictory: () => {
				this.gameState.setCollectedItem(true);
				if (this.questController.currentChapter) {
					this.progressService.updateChapterState(this.questController.currentChapter.id, { collectedItem: true });
				}
			},
			onLocked: (message) => { this.gameState.setLockedMessage(message); },
			getState: () => ({
				level: this.chapterId,
				chapterData: this.getChapterData(this.chapterId),
				heroPos: this.heroPos,
				hotSwitchState: this.hotSwitchState,
				hasCollectedItem: this.hasCollectedItem
			}),
			getNpcPosition: () => this.getChapterData(this.chapterId)?.npc?.position
		});

		// Initialize QuestController
		this.questController = new QuestController(this, {
			progressService: this.progressService,
			onQuestStart: (quest) => {
				this.currentQuest = quest;
				this.isInHub = false;
				this.showDialog = false;
				console.log(`🎮 Started quest: ${quest.name}`);
			},
			onChapterChange: (chapter, index) => {
				// Map chapter to level
				this.chapterId = chapter.id;
				// Ensure we have fresh data
				const chapterData = this.getChapterData(chapter.id);
				if (chapterData) {
					this.gameState.setHeroPosition(chapterData.startPos.x, chapterData.startPos.y);

					// Set initial hotSwitchState based on ServiceType
					let initialHotSwitch = null;
					if (chapterData.serviceType === ServiceType.LEGACY) {
						initialHotSwitch = 'legacy';
					} else if (chapterData.serviceType === ServiceType.MOCK) {
						initialHotSwitch = 'test';
					} else if (chapterData.serviceType === ServiceType.NEW) {
						initialHotSwitch = 'new';
					}
					this.gameState.setHotSwitchState(initialHotSwitch);

					// If chapter has hot switch, check zones (might override to null if outside zones)
					if (chapterData.hasHotSwitch) {
						this.zones.checkZones(chapterData.startPos.x, chapterData.startPos.y);
					}
				}
				this.gameState.resetChapterState();

				// Restore state if available
				const state = this.progressService.getChapterState(chapter.id);
				if (state.collectedItem) {
					this.gameState.setCollectedItem(true);
					this.gameState.setRewardCollected(true); // Assume animation already happened if restoring state
					console.log(`🔄 Restored collected item state for chapter ${chapter.id}`);
				}

				console.log(`📖 Chapter ${index + 1}/${chapter.total}: ${chapterData?.name || chapter.id}`);
			},
			onQuestComplete: (quest) => {
				console.log(`✅ Completed quest: ${quest.name}`);
				console.log(`🏆 Earned badge: ${quest.reward.badge}`);
				this.showQuestCompleteDialog = true; // Show quest complete message
			},
			onReturnToHub: () => {
				this.isInHub = true;
				this.currentQuest = null;
				console.log(`🏛️ Returned to Hub`);
			}
		});
	}

	connectedCallback() {
		super.connectedCallback();

		// Initialize Context Providers (must be done after element is connected)
		this.profileProvider = new ContextProvider(this, { context: profileContext, initialValue: { loading: true } });
		this.themeProvider = new ContextProvider(this, { context: themeContext, initialValue: { themeMode: 'light' } });
		this.suitProvider = new ContextProvider(this, { context: suitContext, initialValue: {} });
		this.gearProvider = new ContextProvider(this, { context: gearContext, initialValue: {} });
		this.powerProvider = new ContextProvider(this, { context: powerContext, initialValue: {} });
		this.masteryProvider = new ContextProvider(this, { context: masteryContext, initialValue: {} });

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

	disconnectedCallback() {
		super.disconnectedCallback();
	}

	applyTheme() {
		this.classList.add('wa-theme-pixel');
		this.classList.add(this.themeMode === 'dark' ? 'wa-dark' : 'wa-light');
		this.themeProvider.setValue({ themeMode: this.themeMode });
	}

	// Removed get visualLevel() and get numericLevel()

	updated(changedProperties) {
		if (changedProperties.has('chapterId')) {
			// Reload user data when chapter changes (service might change)
			this.serviceController.loadUserData();
		}
		if (changedProperties.has('chapterId') || changedProperties.has('hasCollectedItem') || changedProperties.has('themeMode') || changedProperties.has('hotSwitchState')) {
			this.updateContexts();
		}
		// Reload user data when switching between services in Level 6
		if (changedProperties.has('hotSwitchState')) {
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
		if (this.questController && this.questController.currentQuest) {
			const quest = this.questController.currentQuest;
			if (quest.chapters && quest.chapters[levelId]) {
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
		if (this.questController && this.questController.hasExitZone()) {
			this.collision.checkExitZone(x, y, currentConfig.exitZone, this.hasCollectedItem);
		}

		this.gameState.setHeroPosition(x, y);
		this.zones.checkZones(x, y);
	}


	triggerLevelTransition() {
		if (this.questController && this.questController.isInQuest()) {
			this.gameState.setEvolving(true);
			setTimeout(() => {
				this.questController.completeChapter();
				this.gameState.setEvolving(false);
			}, 500);
		}
	}


	getActiveService() {
		const chapterData = this.getChapterData(this.chapterId);
		return this.serviceController.getActiveService(chapterData?.serviceType, this.hotSwitchState);
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
  `];

	render() {
		// Show quest complete screen if quest is completed
		if (this.showQuestCompleteDialog) {
			return this.renderQuestComplete();
		}

		// Show hub if not in a quest
		if (this.isInHub) {
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
				.getQuestProgress="${(questId) => this.questController.getQuestProgress(questId)}"
				.isQuestCompleted="${(questId) => this.questController.isQuestCompleted(questId)}"
				.isQuestLocked="${(questId) => !this.progressService.isQuestAvailable(questId)}"
				@reset-progress="${() => this.debug.options.resetProgress()}"
				@open-about="${() => this.shadowRoot.querySelector('about-slides').show()}"
			></quest-hub>
		`;
	}

	handleQuestSelect(questId) {
		this.questController.startQuest(questId);
	}

	handleContinueQuest(questId) {
		this.questController.continueQuest(questId);
	}

	renderGame() {
		const currentConfig = this.getChapterData(this.chapterId);
		if (!currentConfig) {
			return html`<div>Loading level data...</div>`;
		}

		// Handle dynamic background
		let effectiveConfig = { ...currentConfig };
		// Only change background after reward animation is complete
		if (this.isRewardCollected && currentConfig.postDialogBackgroundStyle) {
			effectiveConfig.backgroundStyle = currentConfig.postDialogBackgroundStyle;
		}

		const isCloseToTarget = this.interaction.isCloseToNpc();
		const isLastChapter = this.questController && this.questController.isLastChapter();

		// Replaced hardcoded levels with flags
		const canToggleTheme = currentConfig.canToggleTheme;
		const hasHotSwitch = currentConfig.hasHotSwitch;
		const isFinalBoss = currentConfig.isFinalBoss;
		const assetId = currentConfig.assetId || 'level_1';

		// Dialog Config Logic
		let dialogConfig = currentConfig;

		return html`
			<game-view
				.currentConfig="${effectiveConfig}"
				.isPaused="${this.isPaused}"
				.currentChapterNumber="${this.questController.getCurrentChapterNumber()}"
				.totalChapters="${this.questController.getTotalChapters()}"
				.questTitle="${this.currentQuest?.name}"
				.heroPos="${this.heroPos}"
				.isEvolving="${this.isEvolving}"
				.hotSwitchState="${this.hotSwitchState}"
				.hasCollectedItem="${this.hasCollectedItem}"
				.isRewardCollected="${this.isRewardCollected}"
				.lockedMessage="${this.lockedMessage}"
				.isCloseToTarget="${isCloseToTarget}"
				.showDialog="${this.showDialog}"
				.level="${this.chapterId}"
				.isLastChapter="${isLastChapter}"
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
				const newState = this.hotSwitchState === 'legacy' ? 'new' : 'legacy';
				this.gameState.setHotSwitchState(newState);
				console.log('🔄 Hot Switch toggled to:', newState);
			}}"
				@reward-collected="${() => {
				console.log('🎉 LegacysEndApp received reward-collected event');
				this.gameState.setRewardCollected(true);
				this.requestUpdate(); // Force update just in case
			}}"
			></game-view>
		`;
	}
}

customElements.define('legacys-end-app', LegacysEndApp);