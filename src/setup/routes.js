import { ROUTES } from "../constants/routes.js";
import { logger } from "../services/logger-service.js";

/**
 * Setup application routes
 * @param {Router} router
 * @param {LegacysEndApp} app
 */
export function setupRoutes(router, app) {
	router.addRoute(ROUTES.HUB, () => {
		app.isInHub = true;
		app.currentQuest = null;
		app.showDialog = false;
		app.isLoading = false;
	});

	router.addRoute(ROUTES.QUEST(":id"), (params) => {
		const questId = params.id;
		app.isInHub = false;
		// Start quest if not already active or inconsistent
		if (!app.currentQuest || app.currentQuest.id !== questId) {
			app.questController.startQuest(questId);
		}
	});

	router.addRoute(ROUTES.CHAPTER(":id", ":chapterId"), async (params) => {
		const questId = params.id;
		const chapterId = params.chapterId;
		app.isInHub = false;

		// Helper to redirect to hub
		const redirectToHub = () => {
			logger.warn(`🚫 Quest ${questId} not available. Redirecting to hub.`);
			router.navigate(ROUTES.HUB, true);
		};

		// Helper to continue quest from last available chapter
		const continueFromLastAvailable = async () => {
			logger.info(
				`📖 Continuing quest ${questId} from last available chapter...`,
			);
			await app.questController.continueQuest(questId);
		};

		// If quest not active, start it first
		if (!app.currentQuest || app.currentQuest.id !== questId) {
			// Check if quest is available before starting
			if (!app.progressService.isQuestAvailable(questId)) {
				redirectToHub();
				return;
			}

			// Use loadQuest instead of startQuest to avoid resetting progress
			await app.questController.loadQuest(questId);

			// Now try to jump to the requested chapter
			const success = app.questController.jumpToChapter(chapterId);
			if (!success) {
				// Chapter locked or invalid, continue from last available
				await continueFromLastAvailable();
			}
		} else {
			// Quest already active, just try to jump
			const success = app.questController.jumpToChapter(chapterId);
			if (!success) {
				// Chapter locked, continue from last available
				await continueFromLastAvailable();
			}
		}
	});
}
