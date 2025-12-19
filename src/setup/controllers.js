import { CharacterContextController } from "../controllers/character-context-controller.js";
import { CollisionController } from "../controllers/collision-controller.js";
import { DebugController } from "../controllers/debug-controller.js";
import { GameZoneController } from "../controllers/game-zone-controller.js";
import { InteractionController } from "../controllers/interaction-controller.js";
import { KeyboardController } from "../controllers/keyboard-controller.js";
import { QuestController } from "../controllers/quest-controller.js";
import { ServiceController } from "../controllers/service-controller.js";
import { GameSessionManager } from "../managers/game-session-manager.js";
import { logger } from "../services/logger-service.js";
import { ServiceType } from "../types.js";

/**
 * Setup application controllers
 * @param {LegacysEndApp} app
 */
export function setupControllers(app) {
	// Initialize KeyboardController
	app.keyboard = new KeyboardController(app, {
		speed: 2.5,
		onMove: (dx, dy) => app.handleMove(dx, dy),
		onInteract: () => app.handleInteract(),
		onPause: () => app.togglePause(),
		isEnabled: () =>
			!app.isEvolving && !app.showDialog && !app.isPaused && !app.isInHub,
	});

	// Initialize DebugController
	app.debug = new DebugController(app, {
		jumpToChapter: (levelId) => {
			const data = app.getChapterData(levelId);
			if (data) {
				// Use router for consistent state
				app.router.navigate(
					`/quest/${app.currentQuest?.id}/chapter/${levelId}`,
				);
			}
		},
		giveItem: () => {
			app.gameState.setCollectedItem(true);
			logger.info(`✨ Item collected!`);
		},
		teleport: (x, y) => {
			app.gameState.setHeroPosition(x, y);
			logger.info(`📍 Teleported to(${x}, ${y})`);
		},
		getState: () => ({
			level: app.chapterId,
			hasCollectedItem: app.hasCollectedItem,
			position: app.heroPos,
			themeMode: app.themeMode,
			hotSwitchState: app.hotSwitchState,
			userData: app.userData,
		}),
		setTheme: (mode) => {
			if (mode === "light" || mode === "dark") {
				app.gameState.setThemeMode(mode);
				app.applyTheme();
				logger.info(`🎨 Theme set to: ${mode} `);
			} else {
				logger.error(`❌ Invalid theme: ${mode}. Use 'light' or 'dark'`);
			}
		},
		// Quest commands
		startQuest: (questId) => {
			app.questController.startQuest(questId);
		},
		completeQuest: () => {
			if (app.questController.currentQuest) {
				app.questController.completeQuest();
			} else {
				logger.warn("⚠️ No active quest to complete");
			}
		},
		completeChapter: () => {
			if (app.questController.currentQuest) {
				app.questController.completeChapter();
			} else {
				logger.warn("⚠️ No active quest");
			}
		},
		returnToHub: () => {
			app.questController.returnToHub();
		},
		listQuests: () => {
			const available = app.questController.getAvailableQuests();
			logger.info("📋 Available Quests:");
			available.forEach((q) => {
				const progress = app.questController.getQuestProgress(q.id);
				const completed = app.questController.isQuestCompleted(q.id);
				logger.info(`  ${completed ? "✅" : "⏳"} ${q.name} (${progress}%)`);
			});
			return available;
		},
		getProgress: () => {
			return app.progressService.getProgress();
		},
		resetProgress: () => {
			app.progressService.resetProgress();
			logger.info("🔄 Progress reset");
		},
	});

	// Initialize GameZoneController
	app.zones = new GameZoneController(app, {
		getChapterData: () => app.getChapterData(app.chapterId),
		hasCollectedItem: () => app.hasCollectedItem,
		onThemeChange: (theme) => {
			app.gameState.setThemeMode(theme);
			app.applyTheme();
		},
		onContextChange: (context) => {
			// Only update if changed to avoid loop/thrashing (though setState usually handles check)
			if (app.hotSwitchState !== context) {
				app.gameState.setHotSwitchState(context);
			}
		},
	});

	// Initialize CollisionController
	app.collision = new CollisionController(app, {
		onExitCollision: () => app.triggerLevelTransition(),
	});

	// Initialize ServiceController
	app.serviceController = new ServiceController(app, {
		services: app.services,
		getActiveService: () => app.getActiveService(),
		onDataLoaded: (userData) => {
			app.userData = userData;
		},
		onError: (error) => {
			app.userError = error;
		},
	});

	// Initialize CharacterContextController
	app.characterContexts = new CharacterContextController(app, {
		suitProvider: null, // Will be set in connectedCallback
		gearProvider: null,
		powerProvider: null,
		masteryProvider: null,
		getState: () => ({
			level: app.chapterId,
			chapterData: app.getChapterData(app.chapterId),
			themeMode: app.themeMode,
			hotSwitchState: app.hotSwitchState,
			hasCollectedItem: app.hasCollectedItem,
			userData: app.userData,
			activeService: app.getActiveService(),
		}),
	});

	// Initialize InteractionController
	app.interaction = new InteractionController(app, {
		onShowDialog: () => {
			app.showDialog = true;
		},
		onVictory: () => {
			app.gameState.setCollectedItem(true);
			if (app.questController.currentChapter) {
				app.progressService.updateChapterState(
					app.questController.currentChapter.id,
					{ collectedItem: true },
				);
			}
		},
		onLocked: (message) => {
			app.gameState.setLockedMessage(message);
		},
		getState: () => ({
			level: app.chapterId,
			chapterData: app.getChapterData(app.chapterId),
			heroPos: app.heroPos,
			hotSwitchState: app.hotSwitchState,
			hasCollectedItem: app.hasCollectedItem,
		}),
		getNpcPosition: () => app.getChapterData(app.chapterId)?.npc?.position,
	});

	// Initialize QuestController
	app.questController = new QuestController(app, {
		progressService: app.progressService,
		onQuestStart: (quest) => {
			app.isLoading = true;
			app.currentQuest = quest;
			app.isInHub = false;
			app.showDialog = false;
			logger.info(`🎮 Started quest: ${quest.name} `);

			// Allow a brief moment for state to settle if needed, but primarily reliance on native async
			app.isLoading = false;
		},
		onChapterChange: (chapter, index) => {
			// Map chapter to level
			app.chapterId = chapter.id;

			// Update URL to reflect chapter (without reloading)
			if (app.currentQuest) {
				app.router.navigate(
					`/quest/${app.currentQuest.id}/chapter/${chapter.id}`,
					false, // Push to history instead of replace
				);
			}

			// Ensure we have fresh data
			const chapterData = app.getChapterData(chapter.id);
			if (chapterData?.startPos) {
				app.gameState.setHeroPosition(
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
				app.gameState.setHotSwitchState(initialHotSwitch);

				// If chapter has hot switch, check zones (might override to null if outside zones)
				if (chapterData.hasHotSwitch) {
					app.zones.checkZones(
						chapterData.startPos.x,
						chapterData.startPos.y,
					);
				}
			}
			app.gameState.resetChapterState();

			// Restore state if available
			const state = app.progressService.getChapterState(chapter.id);
			if (state.collectedItem) {
				app.gameState.setCollectedItem(true);
				app.gameState.setRewardCollected(true); // Assume animation already happened if restoring state
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
			app.showQuestCompleteDialog = true; // Show quest complete message
		},
		onReturnToHub: () => {
			app.currentQuest = null;
			logger.info(`🏛️ Returned to Hub`);
			app.router.navigate("/hub");
		},
	});

	// Initialize GameSessionManager (for future use)
	// Currently not actively used, but available for gradual migration
	app.sessionManager = new GameSessionManager({
		gameState: app.gameState,
		progressService: app.progressService,
		questController: app.questController,
		router: app.router,
		controllers: {
			keyboard: app.keyboard,
			interaction: app.interaction,
			collision: app.collision,
			zones: app.zones,
		},
	});
}
