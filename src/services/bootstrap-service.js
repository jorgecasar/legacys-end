import { ReactiveElement } from "lit"; // For appInstance type

// Import all necessary services, controllers, use cases
import { ROUTES } from "../constants/routes.js";
import { QuestController } from "../controllers/quest-controller.js";
import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { AIService } from "../services/ai-service.js";
import { LocalizationService } from "../services/localization-service.js";
import { PreloaderService } from "../services/preloader-service.js";
import { ProgressService } from "../services/progress-service.js";
import { QuestRegistryService } from "../services/quest-registry-service.js";
import { SessionService } from "../services/session-service.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import { ThemeService } from "../services/theme-service.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "../services/user-api-client.js";
import { VoiceSynthesisService } from "../services/voice-synthesis-service.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";
import { Router } from "../utils/router.js";

/**
 * @typedef {import("../types/services.d.js").ILoggerService} ILoggerService
 * @typedef {import("../services/user-api-client.js").UserApiClients} UserApiClients
 * @typedef {import("../types/services.d.js").IStorageAdapter} IStorageAdapter
 * @typedef {import("../types/services.d.js").IProgressService} IProgressService
 * @typedef {import("../types/services.d.js").IAIService} IAIService
 * @typedef {import("../types/services.d.js").IVoiceSynthesisService} IVoiceSynthesisService
 * @typedef {import("../game/services/quest-state-service.js").QuestStateService} QuestStateService
 * @typedef {import("../game/services/world-state-service.js").WorldStateService} WorldStateService
 * @typedef {import("../game/services/hero-state-service.js").HeroStateService} HeroStateService
 * @typedef {import("../controllers/quest-controller.js").QuestController} QuestController
 * @typedef {import("../utils/router.js").Router} Router
 * @typedef {import("../services/session-service.js").SessionService} SessionService
 * @typedef {import("../services/theme-service.js").ThemeService} ThemeService
 * @typedef {import("../services/localization-service.js").LocalizationService} LocalizationService
 * @typedef {import("../services/preloader-service.js").PreloaderService} PreloaderService
 * @typedef {import("../services/quest-registry-service.js").QuestRegistryService} QuestRegistryService
 * @typedef {import("../use-cases/evaluate-chapter-transition.js").EvaluateChapterTransitionUseCase} EvaluateChapterTransitionUseCase
 */

export class BootstrapService {
	/** @type {ILoggerService} */
	#logger;

	/**
	 * @param {ILoggerService} logger - The logger service instance.
	 */
	constructor(logger) {
		this.#logger = logger;
	}

	/**
	 * Initializes and orchestrates all application services and controllers.
	 * @param {ReactiveElement} appInstance - The main app instance (e.g., LegacysEndApp) for QuestController's host dependency.
	 * @returns {Promise<{
	 *  logger: ILoggerService,
	 *  storage: IStorageAdapter,
	 *  themeService: ThemeService,
	 *  registry: QuestRegistryService,
	 *  progressService: IProgressService,
	 *  localizationService: LocalizationService,
	 *  services: UserApiClients, // API Clients
	 *  sessionService: SessionService,
	 *  preloaderService: PreloaderService,
	 *  aiService: IAIService,
	 *  voiceSynthesisService: IVoiceSynthesisService,
	 *  evaluateChapterTransition: EvaluateChapterTransitionUseCase,
	 *  heroState: HeroStateService,
	 *  questState: QuestStateService,
	 *  worldState: WorldStateService,
	 *  router: Router,
	 *  questController: QuestController
	 * }>}
	 */
	async initialize(appInstance) {
		this.#logger.info("BootstrapService: Starting initialization...");

		// 1. Core Infrastructure (basic dependencies)
		const storage = new LocalStorageAdapter({ logger: this.#logger });
		const themeService = new ThemeService({
			storage: storage,
			logger: this.#logger,
		});
		const registry = new QuestRegistryService();
		const progressService = new ProgressService(
			storage,
			registry,
			this.#logger,
		);
		const localizationService = new LocalizationService({
			storage: storage,
			logger: this.#logger,
		});

		localizationService.onLocaleChange(() => {
			registry.invalidateQuestCache();
		});

		// 2. API Services
		const userApiClients = {
			legacy: new LegacyUserApiClient(),
			mock: new MockUserApiClient(),
			new: new NewUserApiClient(),
		};

		// 3. Application Services
		const sessionService = new SessionService();
		const preloaderService = new PreloaderService({ logger: this.#logger });
		const aiService = new AIService({ logger: this.#logger });
		const voiceSynthesisService = new VoiceSynthesisService({
			logger: this.#logger,
		});
		const evaluateChapterTransition = new EvaluateChapterTransitionUseCase();

		// 4. Game State (Reactive)
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		// 5. Internal Utilities
		const router = new Router(this.#logger);

		// 6. Controller (QuestController depends on many services and reactive states)
		const questController = new QuestController(appInstance, {
			logger: this.#logger,
			registry: registry,
			progressService: progressService,
			preloaderService: preloaderService,
			state: questState,
			sessionService: sessionService,
			worldState: worldState,
			heroState: heroState,
			router: router,
		});

		router.init(); // Router init after questController to ensure proper hooks are set up.

		if (window.location.pathname === "/" || window.location.pathname === "") {
			router.navigate(ROUTES.HUB, true);
		}

		this.#logger.info("BootstrapService: Initialization complete.");

		return {
			logger: this.#logger,
			storage,
			themeService,
			registry,
			progressService,
			localizationService,
			services: userApiClients,
			sessionService,
			preloaderService,
			aiService,
			voiceSynthesisService,
			evaluateChapterTransition,
			heroState,
			questState,
			worldState,
			router,
			questController,
		};
	}
}
