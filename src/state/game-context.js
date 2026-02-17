/**
 * @typedef {Object} IGameContext
 * @property {import('../types/services.d.js').ILoggerService} logger
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../types/services.d.js').IProgressService} progressService
 * @property {import('../types/services.d.js').ISessionService} sessionService
 * @property {import('../types/game.d.js').IHeroStateService} heroState
 * @property {import('../types/game.d.js').IQuestStateService} questState
 * @property {import('../types/game.d.js').IWorldStateService} worldState
 * @property {import("../utils/router.js").Router} [router]
 * @property {import("../infrastructure/local-storage-adapter.js").LocalStorageAdapter} [storageAdapter]
 * @property {import('../services/user-api-client.js').UserApiClients} [services]
 * @property {import('../services/preloader-service.js').PreloaderService} [preloader]
 * @property {import('../services/quest-registry-service.js').QuestRegistryService} [registry]
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} [evaluateChapterTransition]
 * @property {import('../types/services.d.js').IVoiceSynthesisService} [voiceSynthesisService]
 * @property {import('../types/services.d.js').ILocalizationService} [localizationService]
 * @property {import('../types/services.d.js').IThemeService} [themeService]
 */

// This file only serves as a type definition hub for now.
export {};
