import { ServiceController } from "../controllers/service-controller.js";

/**
 * Setup ServiceController
 * @param {import('../legacys-end-app.js').LegacysEndApp} app
 */
export function setupService(app) {
	app.serviceController = new ServiceController(app, {
		services:
			/** @type {Record<string, import('../services/user-services.js').IUserService>} */ (
				app.services
			),
		getActiveService: () => app.getActiveService(),
		onDataLoaded: (userData) => {
			app.userData = userData;
		},
		onError: (error) => {
			app.userError = error;
		},
	});
}
