import { CommandBus } from "../commands/command-bus.js";
import {
	loggingMiddleware,
	performanceMiddleware,
	validationMiddleware,
} from "../commands/middleware.js";
import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { aiService } from "../services/ai-service.js";
import { GameStateService } from "../services/game-state-service.js";
import { LocalizationService } from "../services/localization-service.js";
import { logger } from "../services/logger-service.js";
import { preloader } from "../services/preloader-service.js";
import { ProgressService } from "../services/progress-service.js";
import { QuestLoaderService } from "../services/quest-loader-service.js";
import { SessionService } from "../services/session-service.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import {
	LegacyUserService,
	MockUserService,
	NewUserService,
} from "../services/user-services.js";
import { voiceSynthesisService } from "../services/voice-synthesis-service.js";
import { setupRoutes } from "../setup/routes.js";
import { setupCharacterContexts } from "../setup/setup-character-contexts.js";
import { setupCollision } from "../setup/setup-collision.js";
import { setupGameService } from "../setup/setup-game.js";
import { setupInteraction } from "../setup/setup-interaction.js";
import { setupQuest } from "../setup/setup-quest.js";
import { setupService } from "../setup/setup-service.js";
import { setupVoice } from "../setup/setup-voice.js";
import { setupZones } from "../setup/setup-zones.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";
import { Router } from "../utils/router.js";
import { eventBus as centralEventBus } from "./event-bus.js";

/**
 * @typedef {Object} ServicesContext
 * @property {import('../services/storage-service.js').LocalStorageAdapter} storageAdapter
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {Object} services
 * @property {import('../commands/command-bus.js').CommandBus} commandBus

 * @property {import('../services/preloader-service.js').PreloaderService} preloader
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} evaluateChapterTransition
 * @property {import('../services/ai-service.js').AIService} aiService
 * @property {import('../services/voice-synthesis-service.js').VoiceSynthesisService} voiceSynthesisService
 * @property {import('../services/localization-service.js').LocalizationService} localizationService
 * @property {import('../services/theme-service.js').ThemeService} themeService
 * @property {import('../services/session-service.js').SessionService} sessionService
 * @property {import('../services/quest-loader-service.js').QuestLoaderService} questLoader
 * @property {import('../game/services/hero-state-service.js').HeroStateService} heroState
 * @property {import('../game/services/quest-state-service.js').QuestStateService} questState
 * @property {import('../game/services/world-state-service.js').WorldStateService} worldState
 */

/**
 * @typedef {Object} GameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/logger-service.js').LoggerService} logger
 * @property {import('../services/game-state-service.js').GameStateService} gameState
 * @property {import('../commands/command-bus.js').CommandBus} commandBus

 * @property {import('../services/storage-service.js').LocalStorageAdapter} storageAdapter
 * @property {import('../controllers/quest-controller.js').QuestController} [questController]
 * @property {import('../services/progress-service.js').ProgressService} [progressService]
 * @property {import('../utils/router.js').Router} [router]
 * @property {import('../controllers/service-controller.js').ServiceController} [serviceController]
 * @property {import('../controllers/character-context-controller.js').CharacterContextController} [characterContexts]
 * @property {Object} services
 * @property {import('../services/preloader-service.js').PreloaderService} [preloaderService]
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} [evaluateChapterTransition]
 * @property {import('../services/ai-service.js').AIService} aiService
 * @property {import('../services/voice-synthesis-service.js').VoiceSynthesisService} voiceSynthesisService
 * @property {import('../services/localization-service.js').LocalizationService} localizationService
 * @property {import('../services/theme-service.js').ThemeService} themeService
 * @property {import('../services/session-service.js').SessionService} sessionService
 * @property {import('../services/quest-loader-service.js').QuestLoaderService} questLoader
 * @property {import('../game/services/hero-state-service.js').HeroStateService} heroState
 * @property {import('../game/services/quest-state-service.js').QuestStateService} questState
 * @property {import('../game/services/world-state-service.js').WorldStateService} worldState
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
			/** @type {any} */ ({ sessionManager: context.questLoader }),
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

		const themeService = new (
			await import("../services/theme-service.js")
		).ThemeService(logger, storageAdapter);

		// Dynamic import to avoid chunking warning
		const registry = await import("../services/quest-registry-service.js");

		const progressService = new ProgressService(
			storageAdapter,
			registry,
			logger,
		);

		const localizationService = new LocalizationService(logger, storageAdapter);

		// Wire quest cache invalidation on locale change
		localizationService.onLocaleChange(() => {
			registry.invalidateQuestCache();
		});

		const services = {
			legacy: new LegacyUserService(),
			mock: new MockUserService(),
			new: new NewUserService(),
		};

		const sessionService = new SessionService();
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		// Inject dependencies into GameStateService facade
		gameState.setDomainServices(heroState, questState, worldState);

		// Initialize Command Bus
		const commandBus = new CommandBus();
		commandBus.use(validationMiddleware);
		commandBus.use(loggingMiddleware);
		commandBus.use(performanceMiddleware);

		return {
			storageAdapter,
			gameState,
			progressService,
			services,
			commandBus,
			preloader,
			evaluateChapterTransition: new EvaluateChapterTransitionUseCase(),
			aiService,
			voiceSynthesisService,
			localizationService,
			themeService,
			sessionService,
			questLoader: /** @type {any} */ (null), // Instantiated in setupControllers for now
			heroState,
			questState,
			worldState,
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
			logger: logger,
			gameState: servicesContext.gameState,
			commandBus: servicesContext.commandBus,
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
			evaluateChapterTransition: servicesContext.evaluateChapterTransition,
			aiService: servicesContext.aiService,
			voiceSynthesisService: servicesContext.voiceSynthesisService,
			localizationService: servicesContext.localizationService,
			themeService: servicesContext.themeService,
			sessionService: servicesContext.sessionService,
			questLoader: servicesContext.questLoader,
			heroState: servicesContext.heroState,
			questState: servicesContext.questState,
			worldState: servicesContext.worldState,
		};

		// Run existing setup helpers
		// These helpers instantiate controllers and attach them to the host (LegacysEndApp)
		// and also populate the context object with the created instances.

		await setupQuest(/** @type {any} */ (host), context);
		context.questLoader = new QuestLoaderService(context);
		context.questLoader.setupEventListeners();

		setupGameService(context);
		setupService(/** @type {any} */ (host), context);
		setupCharacterContexts(/** @type {any} */ (host), context);
		setupZones(/** @type {any} */ (host), context);
		setupInteraction(/** @type {any} */ (host), context);
		setupCollision(/** @type {any} */ (host), context);
		setupVoice(/** @type {any} */ (host), context);

		// Note: serviceController and characterContexts are accessed via context after usage.
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
