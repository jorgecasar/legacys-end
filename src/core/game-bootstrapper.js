import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { LocalizationService } from "../services/localization-service.js";
import { PreloaderService } from "../services/preloader-service.js";
import { ProgressService } from "../services/progress-service.js";
import { SessionService } from "../services/session-service.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "../services/user-api-client.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";
import { Router } from "../utils/router.js";

/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/services.d.js').IStorageAdapter} IStorageAdapter
 * @typedef {import('../types/services.d.js').IProgressService} IProgressService
 * @typedef {import('../services/quest-registry-service.js').QuestRegistryService} QuestRegistryService
 * @typedef {import('../services/theme-service.js').ThemeService} ThemeService
 */

/**
 * @typedef {Object} ServicesContext
 * @property {IStorageAdapter} storage
 * @property {IProgressService} progressService
 * @property {QuestRegistryService} registry
 * @property {Object} services
 * @property {PreloaderService} preloader
 * @property {EvaluateChapterTransitionUseCase} evaluateChapterTransition
 * @property {LocalizationService} localizationService
 * @property {ThemeService} themeService
 * @property {SessionService} sessionService
 * @property {HeroStateService} heroState
 * @property {QuestStateService} questState
 * @property {WorldStateService} worldState
 */

/**
 * @typedef {Object} GameContext
 * @property {ILoggerService | undefined} [logger]
 * @property {IStorageAdapter} storage
 * @property {IProgressService} progressService
 * @property {Router} router
 * @property {Object} services
 * @property {PreloaderService} preloader
 * @property {QuestRegistryService} registry
 * @property {EvaluateChapterTransitionUseCase} evaluateChapterTransition
 * @property {LocalizationService} localizationService
 * @property {ThemeService} themeService
 * @property {SessionService} sessionService
 * @property {HeroStateService} heroState
 * @property {QuestStateService} questState
 * @property {WorldStateService} worldState
 */

/**
 * GameBootstrapper
 *
 * Responsible for initializing the game core services.
 * Controllers and UI orchestration are handled by the main app component.
 */
export class GameBootstrapper {
	/** @type {ILoggerService | undefined} */
	#logger;

	/**
	 * Bootstrap the game application
	 * @param {import('lit').ReactiveControllerHost} _host - The Lit component host
	 * @param {ILoggerService} [logger] - Optional logger instance
	 * @returns {Promise<GameContext>}
	 */
	async bootstrap(_host, logger) {
		this.#logger = logger;
		this.#logger?.info("GameBootstrapper: Starting initialization...");

		const context = await this.#setupServices(this.#logger);
		const router = new Router(this.#logger);

		this.#logger?.info("GameBootstrapper: Initialization complete.");

		return {
			...context,
			logger: this.#logger,
			router,
		};
	}

	/**
	 * @param {ILoggerService} [logger]
	 * @returns {Promise<ServicesContext>}
	 */
	async #setupServices(logger) {
		const storage = new LocalStorageAdapter({ logger });

		const themeService = new (
			await import("../services/theme-service.js")
		).ThemeService({ storage, logger });

		const registry = new (
			await import("../services/quest-registry-service.js")
		).QuestRegistryService();

		const progressService = new ProgressService(storage, registry, logger);

		const localizationService = new LocalizationService({ storage, logger });

		localizationService.onLocaleChange(() => {
			registry.invalidateQuestCache();
		});

		const services = {
			legacy: new LegacyUserApiClient(),
			mock: new MockUserApiClient(),
			new: new NewUserApiClient(),
		};

		const sessionService = new SessionService();
		const preloader = new PreloaderService({ logger });
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		return {
			storage,
			progressService,
			services,
			preloader,
			evaluateChapterTransition: new EvaluateChapterTransitionUseCase(),
			localizationService,
			themeService,
			sessionService,
			registry,
			heroState,
			questState,
			worldState,
		};
	}
}
