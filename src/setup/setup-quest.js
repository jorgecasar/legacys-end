import { QuestController } from "../controllers/quest-controller.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup QuestController
 * @param {import('lit').LitElement} host
 * @param {IGameContext} context
 */
export async function setupQuest(host, context) {
	if (!context) {
		console.error("setupQuest: context is undefined");
		return;
	}
	context.questController = new QuestController(host, {
		progressService: context.progressService,
		eventBus: /** @type {any} */ (context).eventBus,
		logger: /** @type {any} */ (context).logger,
		registry: await import("../services/quest-registry-service.js"),
		preloaderService: context.preloaderService,
		evaluateChapterTransition:
			/** @type {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} */ (
				context.evaluateChapterTransition
			),
	});
}
