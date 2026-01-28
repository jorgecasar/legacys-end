/**
 * @typedef {Object} IGameContext
 * @property {import('../services/logger-service.js').LoggerService} logger

 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../services/session-service.js').SessionService} sessionService
 * @property {import('../game/interfaces.js').IHeroStateService} heroState
 * @property {import('../game/interfaces.js').IQuestStateService} questState
 * @property {import('../game/interfaces.js').IWorldStateService} worldState
 * @property {import("../utils/router.js").Router} [router]
 * @property {import("../services/storage-service.js").LocalStorageAdapter} [storageAdapter]
 * @property {import('../services/user-api-client.js').UserApiClients} [services]
 * @property {import('../services/preloader-service.js').PreloaderService} [preloader]
 * @property {import('../services/quest-registry-service.js').QuestRegistryService} [registry]
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} [evaluateChapterTransition]
 * @property {import('../services/voice-synthesis-service.js').VoiceSynthesisService} [voiceSynthesisService]
 * @property {import('../services/localization-service.js').LocalizationService} [localizationService]
 * @property {import('../services/theme-service.js').ThemeService} [themeService]
 */

// This file only serves as a type definition hub for now.
export {};
