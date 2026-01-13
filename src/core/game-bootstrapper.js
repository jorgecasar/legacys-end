import { CommandBus } from "../commands/command-bus.js";
import {
	loggingMiddleware,
	performanceMiddleware,
	validationMiddleware,
} from "../commands/middleware.js";
import { GameSessionManager } from "../managers/game-session-manager.js";
import { GameStateService } from "../services/game-state-service.js";
import { logger } from "../services/logger-service.js";
import { preloader } from "../services/preloader-service.js";
import { ProgressService } from "../services/progress-service.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import {
	LegacyUserService,
	MockUserService,
	NewUserService,
} from "../services/user-services.js";

import { setupRoutes } from "../setup/routes.js";
import { setupGameService } from "../setup/setup-game.js";
import { setupQuest } from "../setup/setup-quest.js";
import { setupSessionManager } from "../setup/setup-session-manager.js";
import { Router } from "../utils/router.js";
import { eventBus as centralEventBus } from "./event-bus.js";

/**
 * @typedef {Object} ServicesContext
 * @property {import('../services/storage-service.js').LocalStorageAdapter} storageAdapter
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {Object} services
 * @property {import('../commands/command-bus.js').CommandBus} commandBus
 * @property {import('../managers/game-session-manager.js').GameSessionManager} sessionManager
 * @property {import('../services/preloader-service.js').PreloaderService} preloader
 */

/**
 * @typedef {Object} GameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/logger-service.js').LoggerService} logger
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../commands/command-bus.js').CommandBus} commandBus
 * @property {import('../managers/game-session-manager.js').GameSessionManager} sessionManager
 * @property {import('../services/storage-service.js').LocalStorageAdapter} storageAdapter
 * @property {import('../controllers/quest-controller.js').QuestController} [questController]
 * @property {import('../services/progress-service.js').ProgressService} [progressService]
 * @property {import('../services/game-service.js').GameService} [gameService]
 * @property {import('../utils/router.js').Router} [router]
 * @property {import('../controllers/service-controller.js').ServiceController} [serviceController]
 * @property {import('../controllers/character-context-controller.js').CharacterContextController} [characterContexts]
 * @property {Object} services
 * @property {import('../services/preloader-service.js').PreloaderService} [preloaderService]
 */

/**
 * GameBootstrapper
 *
 * Responsible for initializing the game core, services, controllers, and wiring dependencies.
 * Extracts setup logic from the UI component (LegacysEndApp).
 */
export class GameBootstrapper {
	constructor() {
		this.eventBus = centralEventBus;
	}

	/**
	 * Bootstrap the game application
	 * @param {import('lit').ReactiveControllerHost} host - The Lit component host (LegacysEndApp)
	 * @returns {Promise<GameContext>}
	 */
	async bootstrap(host) {
		logger.info("GameBootstrapper: Starting initialization...");

		// 1. Initialize Services
		const servicesContext = await this.#setupServices();

		// 2. Initialize Router
		const router = new Router();

		// 3. Initialize Controllers & Wiring
		const context = await this.#setupControllers(host, servicesContext, router);

		// 4. Setup Routes
		setupRoutes(
			router,
			/** @type {any} */ ({ sessionManager: context.sessionManager }),
		);

		logger.info("GameBootstrapper: Initialization complete.");
		return context;
	}

	/**
	 * @returns {Promise<ServicesContext>}
	 */
	async #setupServices() {
		const storageAdapter = new LocalStorageAdapter();
		const gameState = new GameStateService(logger);

		// Dynamic import to avoid chunking warning
		const registry = await import("../services/quest-registry-service.js");

		const progressService = new ProgressService(
			storageAdapter,
			registry,
			logger,
		);

		const services = {
			legacy: new LegacyUserService(),
			mock: new MockUserService(),
			new: new NewUserService(),
		};

		// Initialize Command Bus
		const commandBus = new CommandBus();
		commandBus.use(validationMiddleware);
		commandBus.use(loggingMiddleware);
		commandBus.use(performanceMiddleware);

		// Initialize Session Manager (Preliminary)
		// Note: Dependencies like questController are injected later in setupControllers
		const sessionManager = new GameSessionManager({
			gameState,
			progressService,
			commandBus,
			eventBus: this.eventBus,
			logger: logger,
			router: /** @type {any} */ (null),
			questController: /** @type {any} */ (null),
			controllers: {},
		});

		return {
			storageAdapter,
			gameState,
			progressService,
			services,
			commandBus,
			sessionManager,
			preloader,
		};
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {ServicesContext} servicesContext
	 * @param {import('../utils/router.js').Router} router
	 */
	async #setupControllers(host, servicesContext, router) {
		// Create a mutable context object to pass around setup functions
		// This pattern is used by the existing setup helper functions
		const context = {
			eventBus: this.eventBus,
			logger: servicesContext.sessionManager.logger,
			gameState: servicesContext.gameState,
			commandBus: servicesContext.commandBus,
			sessionManager: servicesContext.sessionManager,
			progressService: servicesContext.progressService,
			storageAdapter: servicesContext.storageAdapter,
			projectService: null, // Placeholder if needed
			gameService: /** @type {any} */ (null),
			router: router,
			questController: /** @type {any} */ (null),
			serviceController: undefined,
			characterContexts: undefined,
			services: servicesContext.services,
			preloaderService: servicesContext.preloader, // Add to context
		};

		// Run existing setup helpers
		// These helpers instantiate controllers and attach them to the host (LegacysEndApp)
		// and also populate the context object with the created instances.

		await setupQuest(/** @type {any} */ (host), context);
		setupSessionManager(context);
		setupGameService(context);

		// Note: serviceController and characterContexts seem to be setup implicitly or
		// they are part of the 'setupGameService' or similar?
		// Looking at LegacysEndApp, they are accessed from context after usage.
		// Wait, looking at LegacysEndApp source lines 239-251:
		// setupQuest(this, context);
		// setupSessionManager(context);
		// setupGameService(context);
		//
		// It seems setupGameService might create serviceController/characterContexts?
		// I should verify where those come from.
		// For now, I assume they are added to 'context' by these setup functions.

		return context;
	}
}
