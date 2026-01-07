import { EVENTS } from "../constants/events.js";
import { ProcessGameZoneInteractionUseCase } from "../use-cases/process-game-zone-interaction.js";
/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("../services/game-state-service.js").ThemeMode} ThemeMode
 * @typedef {import("../services/game-state-service.js").HotSwitchState} HotSwitchState
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} LevelConfig
 * @typedef {import("../core/event-bus.js").EventBus} EventBus
 */

/**
 * @typedef {Object} GameZoneOptions
 * @property {EventBus} [eventBus] - Event bus for emitting events
 * @property {function(): LevelConfig|null} [getChapterData] - Callback to get current chapter config
 * @property {function(): boolean} [hasCollectedItem] - Callback to check if item is collected
 * @property {ProcessGameZoneInteractionUseCase} [processGameZoneInteraction] - Use case
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
	 * @param {GameZoneOptions} [options]
	 */
	constructor(host, options = {}) {
		this.host = host;
		/** @type {Required<GameZoneOptions>} */
		this.options = {
			eventBus: /** @type {any} */ (null),
			getChapterData: () => null,
			hasCollectedItem: () => false,
			processGameZoneInteraction: new ProcessGameZoneInteractionUseCase(),
			...options,
		};

		host.addController(this);
	}

	/**
	 * Lifecycle method called when host connects to DOM
	 */
	hostConnected() {
		// No setup needed for this controller
	}

	/**
	 * Lifecycle method called when host disconnects from DOM
	 */
	hostDisconnected() {
		// No cleanup needed for this controller
	}

	/**
	 * Check if character is in a specific zone and trigger callbacks
	 * @param {number} x - Character X position (0-100)
	 * @param {number} y - Character Y position (0-100)
	 */
	checkZones(x, y) {
		const chapter = this.options.getChapterData();
		if (!chapter) return;

		const results = this.options.processGameZoneInteraction.execute({
			x,
			y,
			chapter,
			hasCollectedItem: this.options.hasCollectedItem(),
		});

		results.forEach((result) => {
			if (result.type === "THEME_CHANGE" && this.options.eventBus) {
				this.options.eventBus.emit(EVENTS.UI.THEME_CHANGED, {
					theme: result.payload,
				});
			} else if (result.type === "CONTEXT_CHANGE" && this.options.eventBus) {
				this.options.eventBus.emit(EVENTS.UI.CONTEXT_CHANGED, {
					context: result.payload,
				});
			}
		});
	}
}
