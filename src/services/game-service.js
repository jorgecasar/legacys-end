import { logger } from "./logger-service.js";

/**
 * @typedef {Object} GameServiceOptions
 * @property {function(string): void} [setLevel] - Callback to jump to a chapter
 * @property {function(): void} [giveItem] - Callback to give current level's item
 * @property {function(number, number): void} [teleport] - Callback to teleport character
 * @property {function(): Object} [getState] - Callback to get current game state
 * @property {function(string): void} [setTheme] - Callback to switch theme
 * @property {function(string): void} [startQuest] - Callback to start a quest
 * @property {function(): void} [completeQuest] - Callback to complete current quest
 * @property {function(): void} [completeChapter] - Callback to complete current chapter
 * @property {function(): void} [returnToHub] - Callback to return to hub
 * @property {function(): Object[]} [listQuests] - Callback to list quests
 * @property {function(): Object} [getProgress] - Callback to get progress
 * @property {function(): void} [resetProgress] - Callback to reset progress
 */

/**
 * GameService - Centralized service for game operations
 *
 * Provides a clean API for game commands without using global variables.
 * This service is injected as a dependency instead of being exposed on window.
 */
export class GameService {
	/**
	 * @param {GameServiceOptions} [options]
	 */
	constructor(options = {}) {
		this.options = options;
	}

	/**
	 * Jump to any chapter
	 * @param {string} chapterId - Chapter ID to jump to
	 */
	setChapter(chapterId) {
		this.options.setLevel?.(chapterId);
	}

	/**
	 * Give current level's item
	 */
	giveItem() {
		this.options.giveItem?.();
	}

	/**
	 * Teleport character to position
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 */
	teleport(x, y) {
		this.options.teleport?.(x, y);
	}

	/**
	 * Get current game state
	 * @returns {Object} Current game state
	 */
	getState() {
		const state = this.options.getState?.() || {};
		logger.info("Current Game State:", state);
		return state;
	}

	/**
	 * Switch theme
	 * @param {string} mode - Theme mode ('light' or 'dark')
	 */
	setTheme(mode) {
		this.options.setTheme?.(mode);
	}

	/**
	 * Start a specific quest
	 * @param {string} questId - Quest ID to start
	 */
	startQuest(questId) {
		this.options.startQuest?.(questId);
	}

	/**
	 * Complete current quest
	 */
	completeQuest() {
		this.options.completeQuest?.();
	}

	/**
	 * Complete current chapter
	 */
	completeChapter() {
		this.options.completeChapter?.();
	}

	/**
	 * Return to quest hub
	 */
	returnToHub() {
		this.options.returnToHub?.();
	}

	/**
	 * List all available quests
	 * @returns {Object[]} List of quests
	 */
	listQuests() {
		return this.options.listQuests?.() || [];
	}

	/**
	 * Get quest progress
	 * @returns {Object} Quest progress data
	 */
	getProgress() {
		const progress = this.options.getProgress?.() || {};
		logger.info("📊 Quest Progress:", progress);
		return progress;
	}

	/**
	 * Reset all quest progress
	 */
	resetProgress() {
		if (this.options.resetProgress) {
			this.options.resetProgress();
			logger.info("🔄 Progress reset!");
		}
	}

	/**
	 * Show help in console
	 */
	help() {
		logger.info(`
🎮 Game Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL COMMANDS:
  setChapter('id')       - Jump to any chapter
  giveItem()             - Collect current level's item
  teleport(x, y)         - Move character to position
  setTheme('light'|'dark') - Switch theme

QUEST COMMANDS:
  startQuest(id)         - Start a specific quest
  completeQuest()        - Complete current quest
  completeChapter()      - Complete current chapter
  returnToHub()          - Return to quest hub
  listQuests()           - List all available quests
  getProgress()          - View quest progress
  resetProgress()        - Reset all quest progress

GENERAL:
  getState()             - View current game state
  help()                 - Show this help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		`);
	}
}
