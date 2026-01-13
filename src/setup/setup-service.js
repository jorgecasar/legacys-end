import { ServiceController } from "../controllers/service-controller.js";

/**
 * @typedef {import('lit').LitElement} ServiceHost
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup ServiceController
 * @param {ServiceHost} host
 * @param {IGameContext} context
 */
export function setupService(host, context) {
	/** @type {ServiceHost & { serviceController: ServiceController }} */ (
		host
	).serviceController = new ServiceController(host, {
		services: context.services || {},
		getActiveService: () => context.serviceController?.getActiveService(),
	});
	context.serviceController = /** @type {any} */ (host).serviceController;
}
