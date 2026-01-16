import { ROUTES } from "../constants/routes.js";

/** @typedef {import('../utils/router.js').Router} Router */

/** @typedef {import('../core/game-context.js').IGameContext} IGameContext */

/**
 * Setup application routes
 * @param {Router} router
 * @param {IGameContext} context
 */
export function setupRoutes(router, context) {
	router.addRoute(ROUTES.HUB, () => {
		context.questLoader?.returnToHub();
	});

	router.addRoute(
		ROUTES.QUEST(":id"),
		(/** @type {Record<string, string>} */ params) => {
			context.questLoader?.startQuest(params.id);
		},
	);

	router.addRoute(
		ROUTES.CHAPTER(":id", ":chapterId"),
		(/** @type {Record<string, string>} */ params) => {
			context.questLoader?.loadChapter(params.id, params.chapterId);
		},
	);
}
