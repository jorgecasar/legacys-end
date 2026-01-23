import { gameConfig } from "../config/game-configuration.js";
import { VoiceController } from "../controllers/voice-controller.js";

/**
 * @typedef {import('lit').LitElement} LitElement
 * @typedef {Object} VoiceHost
 * @property {import('../controllers/game-controller.js').GameController | null} gameController
 * @property {import('../controllers/interaction-controller.js').InteractionController | null} interaction
 * @property {ShadowRoot | null} shadowRoot
 * @property {() => void} [handleLevelComplete]
 * @property {(dx: number, dy: number, isAuto?: boolean) => void} [handleMove]
 * @property {(x: number, y: number) => void} [moveTo]
 * @property {() => void} [nextDialogSlide]
 * @property {() => void} [prevDialogSlide]
 */

/**
 * @typedef {LitElement & VoiceHost} VoiceElement
 */

/**
 * @typedef {Object} VoiceDependencies
 * @property {import('../services/interfaces.js').ILoggerService} logger
 * @property {import('../services/interfaces.js').ILocalizationService} localizationService
 * @property {import('../services/interfaces.js').IAIService} aiService
 * @property {import('../services/interfaces.js').IVoiceSynthesisService} voiceSynthesisService
 * @property {import('../game/interfaces.js').IWorldStateService} worldState
 * @property {import('../game/interfaces.js').IQuestStateService} questState
 * @property {import('../services/interfaces.js').IQuestController} questController
 * @property {import('../services/interfaces.js').IQuestLoaderService} questLoader
 */

/**
 * Helper to wait for dialog text to change (or a timeout)
 * @param {import('../game/interfaces.js').IWorldStateService} worldState
 * @param {string|null} oldText
 * @returns {Promise<void>}
 */
function waitForDialogChange(worldState, oldText) {
	return new Promise((resolve) => {
		const timeout = setTimeout(resolve, 1000);
		const check = () => {
			if (worldState.currentDialogText.get() !== oldText) {
				clearTimeout(timeout);
				resolve();
			} else {
				requestAnimationFrame(check);
			}
		};
		requestAnimationFrame(check);
	});
}

/**
 * Setup VoiceController
 * @param {VoiceElement} host
 * @param {VoiceDependencies} dependencies
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
			aiService,
			voiceSynthesisService,
			onMove: (dx, dy) => {
				if (typeof (/** @type {any} */ (host).handleMove) === "function") {
					/** @type {any} */ (host).handleMove(dx, dy);
				}
			},
			onInteract: async () => {
				if (/** @type {any} */ (host).interaction) {
					const currentText = worldState.currentDialogText.get();
					/** @type {any} */ (host).interaction.handleInteract();
					await waitForDialogChange(worldState, currentText);
				}
			},
			onPause: () => {
				if (worldState) {
					worldState.setPaused(!worldState.isPaused.get());
				}
			},
			onNextSlide: async () => {
				if (typeof host.nextDialogSlide === "function") {
					const currentText = worldState.currentDialogText.get();
					host.nextDialogSlide();
					await waitForDialogChange(worldState, currentText);
				}
			},
			onPrevSlide: async () => {
				if (typeof host.prevDialogSlide === "function") {
					const currentText = worldState.currentDialogText.get();
					host.prevDialogSlide();
					await waitForDialogChange(worldState, currentText);
				}
			},
			onGetDialogText: () => {
				return worldState.currentDialogText.get() || "";
			},
			onGetNextDialogText: () => {
				return worldState.nextDialogText?.get() ?? "";
			},
			onGetContext: () => {
				const chapter = questController.currentChapter;
				return {
					isDialogOpen: worldState.showDialog.get(),
					isRewardCollected: questState.isRewardCollected.get(),
					npcName: chapter?.npc?.name ?? null,
					exitZoneName: chapter?.exitZone ? "exit" : null,
					chapterTitle: chapter?.title ?? null,
				};
			},
			onMoveToNpc: () => {
				const currentChapter = questController.currentChapter;
				const npcPos = currentChapter?.npc?.position;
				if (!npcPos) return;

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

				if (host.moveTo) {
					host.moveTo(exitZone.x, exitZone.y);
				}
			},
			onCompleteLevel: () => {
				if (typeof host.handleLevelComplete === "function") {
					host.handleLevelComplete();
				}
			},
			onDebugAction: (action, value) => {
				if (questLoader && /** @type {any} */ (questLoader)[action]) {
					/** @type {any} */ (questLoader)[action](value);
				}
			},
			isEnabled: () => true,
		});
}
