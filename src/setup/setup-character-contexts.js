import { CharacterContextController } from "../controllers/character-context-controller.js";

/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup CharacterContextController
 * @param {import('lit').LitElement} host
 * @param {IGameContext} context
 */
export function setupCharacterContexts(host, context) {
	context.characterContexts = new CharacterContextController(
		/** @type {import('lit').ReactiveControllerHost} */ (host),
		{
			suitProvider: undefined, // Will be set in connectedCallback
			gearProvider: undefined,
			powerProvider: undefined,
			masteryProvider: undefined,
			gameState: context.gameState,
			questController: context.questController,
			themeService:
				/** @type {import('../services/theme-service.js').ThemeService} */ (
					context.themeService
				),
		},
	);
}
