import { QuestController } from "../controllers/quest-controller.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup QuestController
 * @param {import('lit').LitElement} host
 * @param {Object} dependencies
 * @param {import('../services/progress-service.js').ProgressService} dependencies.progressService
 * @param {import('../services/logger-service.js').LoggerService} dependencies.logger
 * @param {import('../services/quest-registry-service.js').QuestRegistryService} dependencies.registry
 * @param {import('../services/preloader-service.js').PreloaderService} [dependencies.preloaderService]
 * @param {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} dependencies.evaluateChapterTransition
 * @param {import('../game/services/quest-state-service.js').QuestStateService} dependencies.questState
 * @returns {QuestController}
 */
export function setupQuest(
	host,
	{
		progressService,
		logger,
		registry,
		preloaderService,
		evaluateChapterTransition,
		questState,
	},
) {
	return new QuestController(host, {
		progressService,
		logger,
		registry,
		preloaderService,
		evaluateChapterTransition,
		state: questState,
	});
}
