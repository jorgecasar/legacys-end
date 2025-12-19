import { ROUTES } from "../constants/routes.js";

/** @typedef {import('../utils/router.js').Router} Router */
/** @typedef {import('../legacys-end-app.js').LegacysEndApp} LegacysEndApp */

/**
 * Setup application routes
 * @param {Router} router
 * @param {LegacysEndApp} app
 */
export function setupRoutes(router, app) {
	router.addRoute(ROUTES.HUB, () => {
		app.sessionManager.returnToHub();
	});

	router.addRoute(ROUTES.QUEST(":id"), (params) => {
		app.sessionManager.startQuest(params.id);
	});

	router.addRoute(ROUTES.CHAPTER(":id", ":chapterId"), (params) => {
		app.sessionManager.loadChapter(params.id, params.chapterId);
	});
}
