/**
 * @typedef {Object} IGameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/logger-service.js').LoggerService} logger
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../commands/command-bus.js').CommandBus} commandBus
 * @property {import('../managers/game-session-manager.js').GameSessionManager} sessionManager
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../services/game-service.js').GameService} [gameService]
 * @property {import("../utils/router.js").Router} [router]
 * @property {import("../services/storage-service.js").LocalStorageAdapter} [storageAdapter]
 * @property {import('../controllers/interaction-controller.js').InteractionController} [interaction]
 * @property {any} [serviceController]
 * @property {any} [characterContexts]
 * @property {Record<string, any>} [services]
 * @property {import('../services/preloader-service.js').PreloaderService} [preloaderService]
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} [evaluateChapterTransition]
 * @property {import('../services/ai-service.js').AIService} [aiService]
 * @property {import('../services/voice-synthesis-service.js').VoiceSynthesisService} [voiceSynthesisService]
 */

// This file only serves as a type definition hub for now.
export {};
