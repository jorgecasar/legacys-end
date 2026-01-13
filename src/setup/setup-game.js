import { GameController } from "../controllers/game-controller.js";
import { GameService } from "../services/game-service.js";
import { logger } from "../services/logger-service.js";

/**
 * Setup GameController with GameService
 * @param {IGameContext} context
 */
/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup GameService
 * @param {IGameContext} context
 */
export function setupGameService(context) {
	// Create GameService with all game operation callbacks
	const gameService = new GameService({
		setLevel: (chapterId) => {
			// Leverage sessionManager.loadChapter which handles validation
			context.sessionManager.loadChapter(
				context.questController.currentQuest?.id || "",
				chapterId,
			);
		},
		giveItem: () => {
			context.gameState.setCollectedItem(true);
			logger.info(`✨ Item collected!`);
		},
		teleport: (x, y) => {
			context.gameState.setHeroPosition(x, y);
			logger.info(`📍 Teleported to(${x}, ${y})`);
		},
		getState: () => {
			const state = context.gameState.getState();
			return {
				level: context.questController.currentChapter?.id || "",
				hasCollectedItem: state.hasCollectedItem,
				position: state.heroPos,
				themeMode: state.themeMode,
				hotSwitchState: state.hotSwitchState,
			};
		},
		setTheme: (mode) => {
			if (mode === "light" || mode === "dark") {
				context.gameState.setThemeMode(mode);
				context.eventBus.emit("theme-changed", { theme: mode });
				logger.info(`🎨 Theme set to: ${mode} `);
			} else {
				logger.error(`❌ Invalid theme: ${mode}. Use 'light' or 'dark'`);
			}
		},
		// Quest commands
		startQuest: (questId) => {
			context.sessionManager.startQuest(questId);
		},
		completeQuest: () => {
			context.sessionManager.completeQuest();
		},
		completeChapter: () => {
			context.sessionManager.completeChapter();
		},
		returnToHub: () => {
			context.sessionManager.returnToHub();
		},
		listQuests: () => {
			const available = context.questController.getAvailableQuests();
			logger.info("📋 Available Quests:");
			available.forEach((q) => {
				const progress = context.questController.getQuestProgress(q.id);
				const completed = context.questController.isQuestCompleted(q.id);
				logger.info(`  ${completed ? "✅" : "⏳"} ${q.name} (${progress}%)`);
			});
			return available;
		},
		getProgress: () => {
			return context.progressService.getProgress();
		},
		resetProgress: () => {
			context.progressService.resetProgress();
			logger.info("🔄 Progress reset");
		},
	});

	context.gameService = gameService;
}

/**
 * @typedef {import('lit').LitElement} GameHost
 */

/**
 * Setup GameController
 * @param {GameHost} host
 * @param {IGameContext} context
 */
export function setupGameController(host, context) {
	// Create GameController with GameService
	/** @type {GameHost & { gameController: GameController }} */ (
		host
	).gameController = new GameController(host, {
		...context,
		gameService:
			/** @type {import('../services/game-service.js').GameService} */ (
				context.gameService
			),
	});
}
