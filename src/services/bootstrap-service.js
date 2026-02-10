import { GameStore } from "../core/store.js";
import { EvaluateChapterTransitionUseCase } from "../use-cases/evaluate-chapter-transition.js";
import { AIService } from "./ai-service.js";
import { LocalizationService } from "./localization-service.js";
import { LoggerService } from "./logger-service.js";
import { PreloaderService } from "./preloader-service.js";
import { ProgressService } from "./progress-service.js";
import { QuestRegistryService } from "./quest-registry-service.js";
import { SessionService } from "./session-service.js";
import { LocalStorageAdapter } from "./storage-service.js";
import { ThemeService } from "./theme-service.js";
import { VoiceSynthesisService } from "./voice-synthesis-service.js";

/**
 * BootstrapService
 * Handles the initialization of all core services in the correct order.
 */
export class BootstrapService {
	/**
	 * Initializes the application services.
	 * @returns {Promise<{
	 *   gameStore: GameStore,
	 *   storage: LocalStorageAdapter,
	 *   logger: LoggerService,
	 *   preloader: PreloaderService,
	 *   progress: ProgressService,
	 *   questRegistry: QuestRegistryService,
	 *   session: SessionService,
	 *   voiceSynthesis: VoiceSynthesisService,
	 *   theme: ThemeService,
	 *   localization: LocalizationService,
	 *   ai: AIService,
	 *   evaluateChapterTransition: EvaluateChapterTransitionUseCase
	 * }>}
	 */
	static async init() {
		// 1. Core Services (Logger, Storage)
		const logger = new LoggerService();
		const storage = new LocalStorageAdapter({ logger });

		// 2. State Management
		const gameStore = new GameStore();

		// 3. Domain Services
		const session = new SessionService();
		const preloader = new PreloaderService({ logger });
		const questRegistry = new QuestRegistryService();
		const voiceSynthesis = new VoiceSynthesisService({ logger });
		const theme = new ThemeService({ storage, logger });
		const ai = new AIService({ logger });
		const localization = new LocalizationService({ storage, logger });

		// 4. Progress Service
		const progress = new ProgressService(storage, questRegistry, logger);

		// 5. Use Cases
		const evaluateChapterTransition = new EvaluateChapterTransitionUseCase();

		return {
			gameStore,
			storage,
			logger,
			preloader,
			progress,
			questRegistry,
			session,
			voiceSynthesis,
			theme,
			localization,
			ai,
			evaluateChapterTransition,
		};
	}
}
