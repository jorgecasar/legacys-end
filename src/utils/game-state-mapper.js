/**
 * Maps the application state to the view state required by GameView.
 * This decouples the internal application state structure from the view's props.
 */
/**
 * Maps the application state to the view state required by GameView.
 * This decouples the internal application state structure from the view's props.
 */
/**
 * @typedef {Object} GameState
 * @property {Object} config
 * @property {boolean} [config.canToggleTheme]
 * @property {boolean} [config.hasHotSwitch]
 * @property {boolean} [config.isFinalBoss]
 * @property {Object} ui
 * @property {boolean} ui.isPaused
 * @property {boolean} ui.showDialog
 * @property {boolean} ui.isQuestCompleted
 * @property {string} ui.lockedMessage
 * @property {Object} quest
 * @property {Object} quest.data
 * @property {number} quest.chapterNumber
 * @property {number} quest.totalChapters
 * @property {boolean} quest.isLastChapter
 * @property {string} quest.levelId
 * @property {Object} hero
 * @property {{x: number, y: number}} hero.pos
 * @property {boolean} hero.isEvolving
 * @property {import('../services/game-state-service.js').HotSwitchState} hero.hotSwitchState
 * @property {Object} levelState
 * @property {boolean} levelState.hasCollectedItem
 * @property {boolean} levelState.isRewardCollected
 * @property {boolean} levelState.isCloseToTarget
 */

/**
 * @typedef {Object} AppSource
 * @property {import('../controllers/interaction-controller.js').InteractionController} [interaction]
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {boolean} isPaused
 * @property {boolean} showDialog
 * @property {boolean} showQuestCompleteDialog
 * @property {{name: string}} currentQuest
 * @property {string} chapterId
 * @property {{x: number, y: number}} heroPos
 * @property {boolean} isEvolving
 * @property {import('../services/game-state-service.js').HotSwitchState} hotSwitchState
 * @property {boolean} hasCollectedItem
 * @property {boolean} isRewardCollected
 */

export const GameStateMapper = {
	/**
	 * Maps the current app state to a GameState object.
	 * @param {AppSource} app - The application instance source
	 * @param {Object} config - The current chapter configuration
	 * @returns {GameState} The mapped game state
	 */
	map(app, config) {
		const isCloseToTarget = app.interaction?.isCloseToNpc() || false;
		const isLastChapter = app.questController?.isLastChapter() || false;

		return {
			config: config,
			ui: {
				isPaused: app.isPaused || false,
				showDialog: app.showDialog,
				isQuestCompleted: app.showQuestCompleteDialog,
				lockedMessage: app.gameState.getState().lockedMessage,
			},
			quest: {
				data: app.currentQuest,
				chapterNumber: app.questController?.getCurrentChapterNumber() || 0,
				totalChapters: app.questController?.getTotalChapters() || 0,
				isLastChapter: isLastChapter,
				levelId: app.chapterId,
			},
			hero: {
				pos: app.heroPos || { x: 0, y: 0 },
				isEvolving: app.isEvolving || false,
				hotSwitchState: app.hotSwitchState,
			},
			levelState: {
				hasCollectedItem: app.hasCollectedItem || false,
				isRewardCollected: app.isRewardCollected || false,
				isCloseToTarget: isCloseToTarget,
			},
		};
	},
};
