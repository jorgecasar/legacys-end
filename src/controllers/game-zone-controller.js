import { EVENTS } from "../constants/events.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("../services/game-state-service.js").ThemeMode} ThemeMode
 * @typedef {import("../services/game-state-service.js").HotSwitchState} HotSwitchState
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} LevelConfig
 * @typedef {import("../core/event-bus.js").EventBus} EventBus
 * @typedef {import("../core/game-context.js").IGameContext} IGameContext
 */

/**
 * @typedef {Object} GameZoneOptions
 * @property {import('../use-cases/process-game-zone-interaction.js').ProcessGameZoneInteractionUseCase} processGameZoneInteraction - Use case
 */

/**
 * GameZoneController - Lit Reactive Controller for zone detection
 *
 * Handles:
 * - Theme zones (dark/light based on Y position) - if chapter.hasThemeZones
 * - Context zones (legacy/new based on position) - if chapter.hasHotSwitch
 *
 * @implements {ReactiveController}
 */
export class GameZoneController {
	/**
	 * @param {ReactiveControllerHost} host
	 * @param {IGameContext} context
	 * @param {GameZoneOptions} [options]
	 */
	/**
	 * @param {ReactiveControllerHost} host
	 * @param {IGameContext} context
	 * @param {GameZoneOptions} options
	 */
	constructor(host, context, options) {
		this.host = host;
		this.context = context;
		this.host = host;
		this.context = context;
		if (!options || !options.processGameZoneInteraction) {
			throw new Error(
				"GameZoneController requires processGameZoneInteraction option",
			);
		}

		/** @type {Required<GameZoneOptions>} */
		this.options = /** @type {Required<GameZoneOptions>} */ (options);

		host.addController(this);
	}

	/**
	 * Lifecycle method called when host connects to the DOM
	 */
	hostConnected() {
		this.context.eventBus.on(EVENTS.UI.HERO_MOVED, this.handleHeroMoved);
	}

	/**
	 * Lifecycle method called when host disconnects from DOM
	 */
	hostDisconnected() {
		this.context.eventBus.off(EVENTS.UI.HERO_MOVED, this.handleHeroMoved);
	}

	/**
	 * @param {{x: number, y: number, hasCollectedItem: boolean}} data
	 */
	handleHeroMoved = ({ x, y, hasCollectedItem }) => {
		this.checkZones(x, y, hasCollectedItem);
	};

	/**
	 * Check if character is in a specific zone and trigger callbacks
	 * @param {number} x - Character X position (0-100)
	 * @param {number} y - Character Y position (0-100)
	 * @param {boolean} [hasCollectedItem]
	 */
	checkZones(x, y, hasCollectedItem = false) {
		const chapter = this.context.questController?.currentChapter;
		if (!chapter) return;

		const results = this.options.processGameZoneInteraction.execute({
			x,
			y,
			chapter,
			hasCollectedItem,
		});

		results.forEach((result) => {
			if (result.type === "THEME_CHANGE") {
				this.context.gameState.setThemeMode(result.payload);
			} else if (result.type === "CONTEXT_CHANGE") {
				this.context.gameState.setHotSwitchState(result.payload);
			}
		});
	}
}
