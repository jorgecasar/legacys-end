import { ROUTES } from "../constants/routes.js";

/** @typedef {import('../utils/router.js').Router} Router */

/** @typedef {import('../core/game-context.js').IGameContext} IGameContext */
/** @typedef {{ id: string }} QuestParams */
/** @typedef {{ id: string, chapterId: string }} ChapterParams */

/**
 * Setup application routes
 * @param {Router} router
 * @param {IGameContext} context
 */
export function setupRoutes(router, context) {
	router.addRoute(ROUTES.HUB, () => {
		context.questController?.returnToHub();
	});

	router.addRoute(ROUTES.QUEST(":id"), (params) => {
		const p = /** @type {QuestParams} */ (params);
		context.questController?.startQuest(p.id || "");
	});

	router.addRoute(ROUTES.CHAPTER(":id", ":chapterId"), (params) => {
		const p = /** @type {ChapterParams} */ (params);
		context.questController?.loadChapter(p.id || "", p.chapterId || "");
	});
}
