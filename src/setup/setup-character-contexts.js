import { CharacterContextController } from "../controllers/character-context-controller.js";

/**
 * Setup CharacterContextController
 * @param {import('../legacys-end-app.js').LegacysEndApp} app
 */
export function setupCharacterContexts(app) {
	app.characterContexts = new CharacterContextController(app, {
		suitProvider: null, // Will be set in connectedCallback
		gearProvider: null,
		powerProvider: null,
		masteryProvider: null,
		getState: () => ({
			level: app.chapterId,
			chapterData: app.getChapterData(app.chapterId),
			themeMode: app.themeMode,
			hotSwitchState: app.hotSwitchState,
			hasCollectedItem: app.hasCollectedItem,
			userData: /** @type {import("../services/user-services.js").UserData} */ (
				app.userData
			),
			activeService: app.getActiveService(),
		}),
	});
}
