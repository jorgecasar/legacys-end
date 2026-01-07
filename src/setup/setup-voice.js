import { NextDialogSlideCommand } from "../commands/next-dialog-slide-command.js";
import { PrevDialogSlideCommand } from "../commands/prev-dialog-slide-command.js";
import { gameConfig } from "../config/game-configuration.js";
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
 /**
 * @typedef {LitElement & VoiceHost} VoiceElement
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup VoiceController
 * @param {VoiceElement} host
 * @param {IGameContext} context
 */
export function setupVoice(host, context) {
	/** @type {VoiceElement & { voice: VoiceController }} */ (host).voice =
		new VoiceController(host, {
			onMove: (dx, dy) => host.handleMove(dx, dy),
			onInteract: () => host.handleInteract(),
			onPause: () => host.togglePause(),
			onNextSlide: () => {
				if (context.commandBus && context.eventBus) {
					context.commandBus.execute(
						new NextDialogSlideCommand(context.eventBus),
					);
				}
			},
			onPrevSlide: () => {
				if (context.commandBus && context.eventBus) {
					context.commandBus.execute(
						new PrevDialogSlideCommand(context.eventBus),
					);
				}
			},
			onGetDialogText: () => {
				const dialog = /** @type {LevelDialog} */ (
					host.shadowRoot.querySelector("level-dialog")
				);
				return dialog ? dialog.getCurrentSlideText() : "";
			},
			onGetContext: () => ({
				isDialogOpen: context.gameState.getState().showDialog,
				isRewardCollected: context.gameState.getState().hasCollectedItem,
			}),
			onMoveToNpc: () => {
				const currentChapter = context.questController.currentChapter;
				const npcPos = currentChapter?.npc?.position;
				if (!npcPos) return;

				// Use host.moveTo as it's the component's internal helper for interpolation
				const interactionDistance =
					(gameConfig?.gameplay?.interactionDistance || 10) - 2;
				host.moveTo(npcPos.x - interactionDistance, npcPos.y);
			},
			onMoveToExit: () => {
				const currentChapter = context.questController.currentChapter;
				const exitZone = currentChapter?.exitZone;
				if (!exitZone) return;

				logger.info(`🚪 Moving to exit at (${exitZone.x}, ${exitZone.y})`);
				host.moveTo(exitZone.x, exitZone.y);
			},
			onDebugAction: (action, value) => {
				// Debug actions are risky to decouple fully yet, but we can use sessionManager or commands
				// For now keep using a dynamic check but via context
				const anyContext = /** @type {any} */ (context);
				if (
					anyContext[action] &&
					typeof anyContext[action].execute === "function"
				) {
					// Treat as a command if it looks like one (fake for now)
				}
				// Original logic was using app.gameService
				if (
					context.sessionManager &&
					/** @type {any} */ (context.sessionManager)[action]
				) {
					/** @type {any} */ (context.sessionManager)[action](value);
				}
			},
			isEnabled: () => true, // Voice should generally be enabled if setup
		});
}
