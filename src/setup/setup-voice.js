import { InteractCommand } from "../commands/interact-command.js";
import { NextDialogSlideCommand } from "../commands/next-dialog-slide-command.js";
import { PauseGameCommand } from "../commands/pause-game-command.js";
import { PrevDialogSlideCommand } from "../commands/prev-dialog-slide-command.js";
import { gameConfig } from "../config/game-configuration.js";
import { VoiceController } from "../controllers/voice-controller.js";
import { GameEvents } from "../core/event-bus.js";

/**
 * @typedef {import('lit').LitElement} LitElement
 * @typedef {Object} VoiceHost
 * @property {import('../controllers/game-controller.js').GameController} gameController
 * @property {import('../controllers/interaction-controller.js').InteractionController} interaction
 * @property {ShadowRoot} shadowRoot
 * @property {() => void} [handleLevelComplete]
 * @property {(x: number, y: number) => void} [moveTo]
 */
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
			logger: context.logger,
			localizationService: context.localizationService,
			// @ts-expect-error - context.aiService is optional in type but guaranteed by bootstrapper
			aiService: context.aiService,
			// @ts-expect-error
			voiceSynthesisService: context.voiceSynthesisService,
			onMove: (dx, dy) => {
				if (context.eventBus) {
					context.eventBus.emit(GameEvents.HERO_MOVE_INPUT, { dx, dy });
				}
			},
			onInteract: () => {
				if (context.commandBus && context.interaction) {
					context.commandBus.execute(
						new InteractCommand({ interactionController: context.interaction }),
					);
				}
			},
			onPause: () => {
				if (context.commandBus && context.worldState) {
					context.commandBus.execute(
						new PauseGameCommand({ worldState: context.worldState }),
					);
				}
			},
			onNextSlide: () => {
				if (context.commandBus) {
					context.commandBus.execute(
						new NextDialogSlideCommand(/** @type {any} */ (host)),
					);
				}
			},
			onPrevSlide: () => {
				if (context.commandBus) {
					context.commandBus.execute(
						new PrevDialogSlideCommand(/** @type {any} */ (host)),
					);
				}
			},
			onGetDialogText: () => {
				return context.worldState.currentDialogText.get() || "";
			},
			onGetContext: () => ({
				isDialogOpen: context.worldState.showDialog.get(),
				isRewardCollected: context.questState.isRewardCollected.get(),
			}),
			onMoveToNpc: () => {
				const currentChapter = context.questController.currentChapter;
				const npcPos = currentChapter?.npc?.position;
				if (!npcPos) return;

				// Use host.moveTo as it's the component's internal helper for interpolation
				const interactionDistance =
					(gameConfig?.gameplay?.interactionDistance || 10) - 2;

				if (host.moveTo) {
					host.moveTo(npcPos.x - interactionDistance, npcPos.y);
				}
			},
			onMoveToExit: () => {
				const currentChapter = context.questController.currentChapter;
				const exitZone = currentChapter?.exitZone;
				if (!exitZone) return;

				context.logger.info(
					`🚪 Moving to exit at (${exitZone.x}, ${exitZone.y})`,
				);
				if (host.moveTo) {
					host.moveTo(exitZone.x, exitZone.y);
				}
			},
			onCompleteLevel: () => {
				// The host (GameView) handles the level completion logic (dialog closing, event emission)
				if (typeof host.handleLevelComplete === "function") {
					host.handleLevelComplete();
				}
			},
			onDebugAction: (action, value) => {
				// Original logic was using app.gameService
				if (
					context.questLoader &&
					/** @type {any} */ (context.questLoader)[action]
				) {
					/** @type {any} */ (context.questLoader)[action](value);
				}
			},
			isEnabled: () => true, // Voice should generally be enabled if setup
		});
}
