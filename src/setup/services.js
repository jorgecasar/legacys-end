import { GameStateService } from "../services/game-state-service.js";
import { logger } from "../services/logger-service.js";
import { ProgressService } from "../services/progress-service.js";
import { container } from "../services/service-container.js";
import { LocalStorageAdapter } from "../services/storage-service.js";
import {
	LegacyUserService,
	MockUserService,
	NewUserService,
} from "../services/user-services.js";

/**
 * Setup application services
 * @param {LegacysEndApp} app
 */
export function setupServices(app) {
	// Initialize Services & Register to Container
	app.storageAdapter = new LocalStorageAdapter();
	app.gameState = new GameStateService();
	app.progressService = new ProgressService(app.storageAdapter);

	container.register("gameState", app.gameState);
	container.register("progress", app.progressService);
	container.register("logger", logger);

	app.services = {
		legacy: new LegacyUserService(),
		mock: new MockUserService(),
		new: new NewUserService(),
	};
	container.register("userServices", app.services);
}
