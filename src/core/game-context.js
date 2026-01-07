/**
 * @typedef {Object} IGameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../commands/command-bus.js').CommandBus} commandBus
 * @property {import('../managers/game-session-manager.js').GameSessionManager} sessionManager
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../services/game-service.js').GameService} [gameService]
 * @property {import("../utils/router.js").Router} [router]
 * @property {import('../controllers/interaction-controller.js').InteractionController} [interaction]
 * @property {any} [serviceController]
 * @property {any} [characterContexts]
 * @property {Record<string, any>} [services]
 */

// This file only serves as a type definition hub for now.
export {};
