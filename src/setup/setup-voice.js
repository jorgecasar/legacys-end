import { VoiceController } from "../controllers/voice-controller.js";
import { logger } from "../services/logger-service.js";

/**
 * @typedef {import('../components/level-dialog.js').LevelDialog} LevelDialog
 */

/**
 * @typedef {import('lit').LitElement} LitElement
 * @typedef {Object} VoiceHost
 * @property {import('../controllers/game-controller.js').GameController} gameController
 * @property {import('../controllers/interaction-controller.js').InteractionController} interaction
 * @property {(dx: number, dy: number) => void} handleMove
 * @property {() => void} handleInteract
 * @property {() => void} togglePause
 * @property {(x: number, y: number) => void} moveTo
 * @property {ShadowRoot} shadowRoot
 * @typedef {LitElement & VoiceHost} VoiceElement
 *
 * @typedef {Object} VoiceAppHost
 * @property {boolean} showDialog
 * @property {boolean} hasCollectedItem
 * @property {string} chapterId
 * @property {import('../services/game-service.js').GameService} gameService
 * @property {(id: string) => any} getChapterData
 * @typedef {LitElement & VoiceAppHost} VoiceApp
 */

/**
 * Setup VoiceController
 * @param {VoiceElement} host
 * @param {VoiceApp} app
 */
export function setupVoice(host, app) {
	/** @type {VoiceElement & { voice: VoiceController }} */ (host).voice =
		new VoiceController(host, {
			onMove: (dx, dy) => host.handleMove(dx, dy),
			onInteract: () => host.handleInteract(),
			onPause: () => host.togglePause(),
			onNextSlide: () => {
				const dialog = /** @type {LevelDialog} */ (
					host.shadowRoot.querySelector("level-dialog")
				);
				if (dialog) dialog.nextSlide();
			},
			onPrevSlide: () => {
				const dialog = /** @type {LevelDialog} */ (
					host.shadowRoot.querySelector("level-dialog")
				);
				if (dialog) dialog.prevSlide();
			},
			onGetDialogText: () => {
				const dialog = /** @type {LevelDialog} */ (
					host.shadowRoot.querySelector("level-dialog")
				);
				return dialog ? dialog.getCurrentSlideText() : "";
			},
			onGetContext: () => ({
				isDialogOpen: app.showDialog,
				isRewardCollected: app.hasCollectedItem,
			}),
			onMoveToNpc: () => {
				const state = host.interaction.options.getState();
				const npcPos = /** @type {any} */ (state.chapterData)?.npc?.position;
				if (!npcPos) return;

				// Centralized move logic in GameView
				const dist = host.interaction.options.interactionDistance - 2;
				host.moveTo(npcPos.x - dist, npcPos.y);
			},
			onMoveToExit: () => {
				const chapterData = app.getChapterData(app.chapterId);
				const exitZone = chapterData?.exitZone;
				if (!exitZone) return;

				logger.info(`🚪 Moving to exit at (${exitZone.x}, ${exitZone.y})`);
				host.moveTo(exitZone.x, exitZone.y);
			},
			onDebugAction: (action, value) => {
				if (
					host.gameController.isEnabled &&
					app.gameService &&
					/** @type {any} */ (app.gameService)[action]
				) {
					/** @type {any} */ (app.gameService)[action](value);
				}
			},
			isEnabled: () => host.gameController?.isEnabled,
		});
}
