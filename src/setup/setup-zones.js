import { GameZoneController } from "../controllers/game-zone-controller.js";

/**
 * @typedef {import('lit').LitElement} ZoneHost
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

import { ProcessGameZoneInteractionUseCase } from "../use-cases/process-game-zone-interaction.js";

/**
 * Setup GameZoneController
 * @param {ZoneHost} host
 * @param {IGameContext} context
 */
export function setupZones(host, context) {
	/** @type {ZoneHost & { zones: GameZoneController }} */ (host).zones =
		new GameZoneController(host, context, {
			processGameZoneInteraction: new ProcessGameZoneInteractionUseCase(),
		});
}
