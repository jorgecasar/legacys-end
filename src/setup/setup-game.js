import { GameController } from "../controllers/game-controller.js";
import { logger } from "../services/logger-service.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup GameService (Facade)
 * @param {Object} dependencies
 * @param {import('../services/quest-loader-service.js').QuestLoaderService} dependencies.questLoader
 * @param {import('../services/session-service.js').SessionService} dependencies.sessionService
 * @param {import('../game/services/quest-state-service.js').QuestStateService} dependencies.questState
 * @param {import('../game/services/hero-state-service.js').HeroStateService} dependencies.heroState
 * @param {import('../controllers/quest-controller.js').QuestController} dependencies.questController
 * @param {import('../services/progress-service.js').ProgressService} dependencies.progressService
 * @param {import('../services/theme-service.js').ThemeService} dependencies.themeService
 * @returns {Object} The created gameService
 */
export function setupGameService({
	questLoader,
	sessionService,
	questState,
	heroState,
	questController,
	progressService,
	themeService,
}) {
	// Create GameService facade with all game operation callbacks
	const gameService = {
		/** @param {string} chapterId */
		setLevel: (chapterId) => {
			// Leverage questLoader which handles validation and state
			questLoader?.loadChapter(
				sessionService.currentQuest.get()?.id || "",
				chapterId,
			);
		},
		giveItem: () => {
			questState.setHasCollectedItem(true);
			questState.setIsRewardCollected(true);
			logger.info(`✨ Item collected!`);
		},
		/** @param {number} x @param {number} y */
		teleport: (x, y) => {
			heroState.setPos(x, y);
			logger.info(`📍 Teleportado a(${x}, ${y})`);
		},
		getState: () => {
			return {
				level: questController.currentChapter?.id || "",
				hasCollectedItem: questState.hasCollectedItem.get(),
				position: heroState.pos.get(),
				themeMode: themeService ? themeService.themeMode.get() : "light",
				hotSwitchState: heroState.hotSwitchState.get(),
			};
		},
		/** @param {string} mode */
		setTheme: (mode) => {
			if (themeService) {
				themeService.setTheme(
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
			questLoader?.startQuest(questId);
		},
		completeQuest: () => {
			questLoader?.completeQuest();
		},
		completeChapter: () => {
			questLoader?.completeChapter();
		},
		returnToHub: () => {
			questLoader?.returnToHub();
		},
		listQuests: () => {
			const available = questController.getAvailableQuests();
			logger.info("📋 Available Quests:");
			available.forEach((q) => {
				const progress = questController.getQuestProgress(q.id);
				const completed = questController.isQuestCompleted(q.id);
				logger.info(`  ${completed ? "✅" : "⏳"} ${q.name} (${progress}%)`);
			});
			return available;
		},
		getProgress: () => {
			return progressService.getProgress();
		},
		resetProgress: () => {
			progressService.resetProgress();
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

	return gameService;
}

/**
 * @typedef {import('lit').LitElement} GameHost
 */

/**
 * Setup GameController
 * @param {GameHost} host
 * @param {Object} dependencies
 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
 * @param {import('../game/services/hero-state-service.js').HeroStateService} dependencies.heroState
 * @param {import('../game/services/quest-state-service.js').QuestStateService} dependencies.questState
 * @param {import('../game/services/world-state-service.js').WorldStateService} dependencies.worldState
 * @param {import('../controllers/quest-controller.js').QuestController} dependencies.questController
 * @param {import('../services/quest-loader-service.js').QuestLoaderService} dependencies.questLoader
 */
export function setupGameController(
	host,
	{ logger, heroState, questState, worldState, questController, questLoader },
) {
	// Create GameController with services
	/** @type {GameHost & { gameController: GameController }} */ (
		host
	).gameController = new GameController(/** @type {any} */ (host), {
		logger,
		heroState,
		questState,
		worldState,
		questController,
		questLoader,
	});
}
