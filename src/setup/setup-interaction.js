import { InteractionController } from "../controllers/interaction-controller.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";

/**
 * @typedef {import('lit').LitElement} InteractionHost
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup InteractionController
 * @param {InteractionHost} host
 * @param {IGameContext} context
 */
export function setupInteraction(host, context) {
	/** @type {InteractionHost & { interaction: InteractionController }} */ (
		host
	).interaction = new InteractionController(host, {
		eventBus: context.eventBus,
		getState: () => {
			const state = context.gameState.getState();
			const currentChapter = context.questController.currentChapter;
			return {
				level: currentChapter?.id || "",
				chapterData: /** @type {any} */ (currentChapter),
				heroPos: state.heroPos,
				hotSwitchState: state.hotSwitchState || "legacy",
				hasCollectedItem: state.hasCollectedItem,
			};
		},
		getNpcPosition: () => context.questController.currentChapter?.npc?.position,
		interactWithNpcUseCase:
			context.sessionManager?._interactWithNpcUseCase ||
			new InteractWithNpcUseCase(),
	});
}
