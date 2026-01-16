import { GameController } from "../controllers/game-controller.js";
import { logger } from "../services/logger-service.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup GameService (Facade)
 * @param {IGameContext} context
 */
export function setupGameService(context) {
	// Create GameService facade with all game operation callbacks
	const gameService = {
		/** @param {string} chapterId */
		setLevel: (chapterId) => {
			// Leverage questLoader which handles validation and state
			context.questLoader?.loadChapter(
				context.sessionService.currentQuest.get()?.id || "",
				chapterId,
			);
		},
		giveItem: () => {
			context.questState.setHasCollectedItem(true);
			context.questState.setIsRewardCollected(true);
			logger.info(`✨ Item collected!`);
		},
		/** @param {number} x @param {number} y */
		teleport: (x, y) => {
			context.heroState.setPos(x, y);
			logger.info(`📍 Teleported to(${x}, ${y})`);
		},
		getState: () => {
			return {
				level: context.questController.currentChapter?.id || "",
				hasCollectedItem: context.questState.hasCollectedItem.get(),
				position: context.heroState.pos.get(),
				themeMode: context.themeService
					? context.themeService.themeMode.get()
					: "light",
				hotSwitchState: context.heroState.hotSwitchState.get(),
			};
		},
		/** @param {string} mode */
		setTheme: (mode) => {
			if (context.themeService) {
				context.themeService.setTheme(
					/** @type {import('../services/theme-service.js').ThemeMode} */ (
						mode
					),
				);
			} else {
				logger.warn("ThemeService not available");
			}
		},
		// Quest commands
		/** @param {string} questId */
		startQuest: (questId) => {
			context.questLoader?.startQuest(questId);
		},
		completeQuest: () => {
			context.questLoader?.completeQuest();
		},
		completeChapter: () => {
			context.questLoader?.completeChapter();
		},
		returnToHub: () => {
			context.questLoader?.returnToHub();
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
		help: () => {
			logger.info(`
Available Commands:
- setLevel(chapterId): Jump to a chapter
- giveItem(): Collect current chapter item
- teleport(x, y): Move hero to position
- getState(): Get current game state
- setTheme(mode): Change theme ('light'|'dark'|'system')
- startQuest(id): Start a specific quest
- completeQuest(): Complete current quest
- completeChapter(): Complete current chapter
- returnToHub(): Return to quest hub
- listQuests(): List all available quests
- getProgress(): Get overall game progress
- resetProgress(): Clear all saved progress
			`);
		},
	};

	context.gameService = /** @type {any} */ (gameService);
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
	).gameController = new GameController(/** @type {any} */ (host), {
		...context,
		gameService: context.gameService,
	});
}
