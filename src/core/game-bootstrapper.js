import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { LocalizationService } from "../services/localization-service.js";
import { logger } from "../services/logger-service.js";
import { preloader } from "../services/preloader-service.js";
import { ProgressService } from "../services/progress-service.js";
import { QuestLoaderService } from "../services/quest-loader-service.js";
import { SessionService } from "../services/session-service.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "../services/user-api-client.js";
import { setupRoutes } from "../setup/routes.js";
import { setupCharacterContexts } from "../setup/setup-character-contexts.js";
import { setupCollision } from "../setup/setup-collision.js";
import { setupGameController, setupGameService } from "../setup/setup-game.js";
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
 * @property {import('../services/progress-service.js').ProgressService} progressService
 * @property {import('../services/quest-registry-service.js').QuestRegistryService} registry
 * @property {Object} services

 * @property {import('../services/preloader-service.js').PreloaderService} preloader
 * @property {import('../use-cases/evaluate-chapter-transition.js').EvaluateChapterTransitionUseCase} evaluateChapterTransition
 * @property {import('../services/ai-service.js').AIService} aiService
 * @property {import('../services/voice-synthesis-service.js').VoiceSynthesisService} voiceSynthesisService
 * @property {import('../services/localization-service.js').LocalizationService} localizationService
 * @property {import('../services/theme-service.js').ThemeService} themeService
 * @property {import('../services/session-service.js').SessionService} sessionService
 * @property {import('../services/quest-loader-service.js').QuestLoaderService} [questLoader]
 * @property {import('../game/services/hero-state-service.js').HeroStateService} heroState
 * @property {import('../game/services/quest-state-service.js').QuestStateService} questState
 * @property {import('../game/services/world-state-service.js').WorldStateService} worldState
 */

/**
 * @typedef {Object} GameContext
 * @property {import('./event-bus.js').EventBus} eventBus
 * @property {import('../services/logger-service.js').LoggerService} logger

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
 * @property {any} [gameService]
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
		setupRoutes(router, context);
		router.init();

		logger.info("GameBootstrapper: Initialization complete.");
		return context;
	}

	/**
	 * @returns {Promise<ServicesContext>}
	 */
	async #setupServices() {
		const storageAdapter = new LocalStorageAdapter();
		const loggerService = logger; // Use global logger

		const themeService = new (
			await import("../services/theme-service.js")
		).ThemeService(loggerService, storageAdapter);

		// Instantiate standardized services
		const registry = new (
			await import("../services/quest-registry-service.js")
		).QuestRegistryService();

		const aiService = new (
			await import("../services/ai-service.js")
		).AIService();

		const voiceSynthesisService = new (
			await import("../services/voice-synthesis-service.js")
		).VoiceSynthesisService();

		const progressService = new ProgressService(
			storageAdapter,
			registry,
			loggerService,
		);

		const localizationService = new LocalizationService(
			loggerService,
			storageAdapter,
		);

		// Wire quest cache invalidation on locale change
		localizationService.onLocaleChange(() => {
			registry.invalidateQuestCache();
		});

		const services = {
			legacy: new LegacyUserApiClient(),
			mock: new MockUserApiClient(),
			new: new NewUserApiClient(),
		};

		const sessionService = new SessionService();
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		return {
			storageAdapter,
			progressService,
			services,
			preloader,
			evaluateChapterTransition: new EvaluateChapterTransitionUseCase(),
			aiService,
			voiceSynthesisService,
			localizationService,
			themeService,
			sessionService,
			registry,
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
		const {
			eventBus,
			progressService,
			questState,
			heroState,
			worldState,
			registry,
			evaluateChapterTransition,
			services,
			themeService,
			sessionService,
			localizationService,
			aiService,
			voiceSynthesisService,
			storageAdapter,
		} = { ...servicesContext, eventBus: this.eventBus };

		// 1. Setup QuestController
		const questController = setupQuest(/** @type {any} */ (host), {
			progressService,
			eventBus,
			logger,
			registry,
			preloaderService: servicesContext.preloader,
			evaluateChapterTransition,
			questState,
		});

		// 2. Setup QuestLoaderService
		const questLoader = new QuestLoaderService({
			questController,
			eventBus,
			logger,
			questState,
			sessionService,
			progressService,
			worldState,
			heroState,
			router,
		});
		questLoader.setupEventListeners();

		// 3. Setup GameService (Visual Facade)
		const gameService = setupGameService({
			questLoader,
			sessionService,
			questState,
			heroState,
			questController,
			progressService,
			themeService,
		});

		// 4. Setup Other Controllers
		setupGameController(/** @type {any} */ (host), {
			logger,
			heroState,
			questState,
			worldState,
			questController,
			questLoader,
		});

		// 4. Setup Services
		const serviceController = setupService(/** @type {any} */ (host), {
			services,
		});

		const characterContexts = setupCharacterContexts(
			/** @type {any} */ (host),
			{
				heroState,
				questState,
				questController,
				themeService,
			},
		);

		setupZones(/** @type {any} */ (host), {
			heroState,
			questState,
			questController,
			themeService,
		});
		setupInteraction(/** @type {any} */ (host), {
			worldState,
			questState,
			heroState,
			questController,
			questLoader,
		});
		setupCollision(/** @type {any} */ (host), {
			heroState,
			questState,
			questController,
		});
		setupVoice(/** @type {any} */ (host), {
			logger,
			localizationService,
			aiService,
			voiceSynthesisService,
			worldState,
			questState,
			questController,
			questLoader,
		});

		return {
			eventBus,
			logger,
			storageAdapter,
			questController,
			progressService,
			router,
			serviceController,
			characterContexts,
			services,
			preloaderService: servicesContext.preloader,
			evaluateChapterTransition,
			aiService,
			voiceSynthesisService,
			localizationService,
			themeService,
			sessionService,
			questLoader,
			heroState,
			questState,
			worldState,
			gameService,
		};
	}
}
