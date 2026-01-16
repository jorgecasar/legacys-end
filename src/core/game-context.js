/**
 * @typedef {Object} IGameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/logger-service.js').LoggerService} logger
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../commands/command-bus.js').CommandBus} commandBus

 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../services/session-service.js').SessionService} sessionService
 * @property {import('../services/quest-loader-service.js').QuestLoaderService} [questLoader]
 * @property {import('../game/interfaces.js').IHeroStateService} heroState
 * @property {import('../game/interfaces.js').IQuestStateService} questState
 * @property {import('../game/interfaces.js').IWorldStateService} worldState
 * @property {any} [gameService]
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
 * @property {import('../services/localization-service.js').LocalizationService} [localizationService]
 * @property {import('../services/theme-service.js').ThemeService} [themeService]
 */

// This file only serves as a type definition hub for now.
export {};
