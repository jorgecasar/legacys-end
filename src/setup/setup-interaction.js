import { InteractionController } from "../controllers/interaction-controller.js";

/**
 * @typedef {Object} InteractionAppHost
 * @property {boolean} showDialog
 * @property {string} chapterId
 * @property {boolean} hasCollectedItem
 * @property {import('../services/game-state-service.js').HotSwitchState} hotSwitchState
 * @property {{x: number, y: number}} heroPos
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../managers/game-session-manager.js').GameSessionManager} sessionManager
 * @property {(id: string) => any} getChapterData
 * @typedef {import('lit').LitElement & InteractionAppHost} InteractionApp
 */

/**
 * Setup InteractionController
 * @param {import('lit').LitElement} host
 * @param {InteractionApp} app
 */
export function setupInteraction(host, app) {
	/** @type {import('lit').LitElement & { interaction: InteractionController }} */ (
		host
	).interaction = new InteractionController(host, {
		onShowDialog: () => {
			app.showDialog = true;
		},
		onVictory: () => {
			app.gameState.setCollectedItem(true);
			/** @typedef {{id: string}} QuestChapter */
			const currentChapter = /** @type {QuestChapter} */ (
				app.questController.currentChapter
			);
			if (currentChapter) {
				app.progressService.updateChapterState(currentChapter.id, {
					collectedItem: true,
				});
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
		...(app.sessionManager?._interactWithNpcUseCase
			? { interactWithNpcUseCase: app.sessionManager._interactWithNpcUseCase }
			: {}),
	});
}
