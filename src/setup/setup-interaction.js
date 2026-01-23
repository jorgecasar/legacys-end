import { InteractionController } from "../controllers/interaction-controller.js";
import { InteractWithNpcUseCase } from "../use-cases/interact-with-npc.js";

/**
 * @typedef {import('lit').LitElement} InteractionHost
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup InteractionController
 * @param {InteractionHost} host
 * @param {Object} dependencies
 * @param {import('../game/interfaces.js').IWorldStateService} dependencies.worldState
 * @param {import('../game/interfaces.js').IQuestStateService} dependencies.questState
 * @param {import('../game/interfaces.js').IHeroStateService} dependencies.heroState
 * @param {import('../services/interfaces.js').IQuestController} dependencies.questController
 * @param {import('../services/interfaces.js').IQuestLoaderService} [dependencies.questLoader]
 */
export function setupInteraction(
	host,
	{ questState, heroState, questController, questLoader },
) {
	/** @type {InteractionHost & { interaction: InteractionController }} */ (
		host
	).interaction = new InteractionController(host, {
		getState: () => {
			const currentChapter = questController.currentChapter;
			return {
				level: currentChapter?.id || "",
				chapterData: /** @type {any} */ (currentChapter),
				heroPos: heroState.pos.get(),
				hotSwitchState: heroState.hotSwitchState.get(),
				hasCollectedItem: questState.hasCollectedItem.get(),
			};
		},
		getNpcPosition: () => questController.currentChapter?.npc?.position ?? null,
		interactWithNpcUseCase:
			questLoader?.interactWithNpcUseCase || new InteractWithNpcUseCase(),
	});
}
