import { GameSessionManager } from "../managers/game-session-manager.js";
import { GameStateService } from "../services/game-state-service.js";
import { ProgressService } from "../services/progress-service.js";
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
	// Initialize Services
	app.storageAdapter = new LocalStorageAdapter();
	app.gameState = new GameStateService();
	app.progressService = new ProgressService(app.storageAdapter);
	// logger is imported globally where needed

	app.services = {
		legacy: new LegacyUserService(),
		mock: new MockUserService(),
		new: new NewUserService(),
	};

	// Initialize Session Manager (after other services are ready)
	app.sessionManager = new GameSessionManager({
		gameState: app.gameState,
		progressService: app.progressService,
		// Router and questController will be set later in setupControllers/app
		router: null,
		questController: null,
		controllers: {},
	});
}
