// Commands removed
import { gameConfig } from "../config/game-configuration.js";
import { VoiceController } from "../controllers/voice-controller.js";

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
 * @param {Object} dependencies
 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
 * @param {import('../services/localization-service.js').LocalizationService} dependencies.localizationService
 * @param {import('../services/ai-service.js').AIService} [dependencies.aiService]
 * @param {import('../services/voice-synthesis-service.js').VoiceSynthesisService} [dependencies.voiceSynthesisService]
 * @param {import('../game/services/world-state-service.js').WorldStateService} dependencies.worldState
 * @param {import('../game/services/quest-state-service.js').QuestStateService} dependencies.questState
 * @param {import('../controllers/quest-controller.js').QuestController} dependencies.questController
 * @param {import('../services/quest-loader-service.js').QuestLoaderService} [dependencies.questLoader]
 */
export function setupVoice(
	host,
	{
		logger,
		localizationService,
		aiService,
		voiceSynthesisService,
		worldState,
		questState,
		questController,
		questLoader,
	},
) {
	/** @type {VoiceElement & { voice: VoiceController }} */ (host).voice =
		new VoiceController(host, {
			logger,
			localizationService,
			// @ts-expect-error - aiService is optional but expected
			aiService,
			// @ts-expect-error
			voiceSynthesisService,
			onMove: (dx, dy) => {
				if (typeof (/** @type {any} */ (host).handleMove) === "function") {
					/** @type {any} */ (host).handleMove(dx, dy);
				}
			},
			onInteract: () => {
				if (/** @type {any} */ (host).interaction) {
					/** @type {any} */ (host).interaction.handleInteract();
				}
			},
			onPause: () => {
				if (worldState) {
					worldState.setPaused(!worldState.isPaused.get());
				}
			},
			onNextSlide: () => {
				if (typeof (/** @type {any} */ (host).nextDialogSlide) === "function") {
					/** @type {any} */ (host).nextDialogSlide();
				}
			},
			onPrevSlide: () => {
				if (typeof (/** @type {any} */ (host).prevDialogSlide) === "function") {
					/** @type {any} */ (host).prevDialogSlide();
				}
			},
			onGetDialogText: () => {
				return worldState.currentDialogText.get() || "";
			},
			onGetContext: () => ({
				isDialogOpen: worldState.showDialog.get(),
				isRewardCollected: questState.isRewardCollected.get(),
			}),
			onMoveToNpc: () => {
				const currentChapter = questController.currentChapter;
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
				const currentChapter = questController.currentChapter;
				const exitZone = currentChapter?.exitZone;
				if (!exitZone) return;

				logger.info(`🚪 Moving to exit at (${exitZone.x}, ${exitZone.y})`);
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
				if (questLoader && /** @type {any} */ (questLoader)[action]) {
					/** @type {any} */ (questLoader)[action](value);
				}
			},
			isEnabled: () => true, // Voice should generally be enabled if setup
		});
}
