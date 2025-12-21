/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("../services/game-state-service.js").ThemeMode} ThemeMode
 * @typedef {import("../services/game-state-service.js").HotSwitchState} HotSwitchState
 * @typedef {import("../content/quests/quest-types.js").LevelConfig} LevelConfig
 */

/**
 * @typedef {Object} GameZoneOptions
 * @property {function(ThemeMode): void} [onThemeChange] - Callback when theme changes
 * @property {function(HotSwitchState): void} [onContextChange] - Callback when API context changes
 * @property {function(): LevelConfig|null} [getChapterData] - Callback to get current chapter config
 * @property {function(): boolean} [hasCollectedItem] - Callback to check if item is collected
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
import { GAME_CONFIG } from "../constants/game-config.js";

export class GameZoneController {
	/**
	 * @param {ReactiveControllerHost} host
	 * @param {GameZoneOptions} [options]
	 */
	constructor(host, options = {}) {
		this.host = host;
		/** @type {Required<GameZoneOptions>} */
		this.options = {
			onThemeChange: () => { },
			onContextChange: () => { },
			getChapterData: () => null,
			hasCollectedItem: () => false,
			...options,
		};

		host.addController(this);
	}



	/**
	 * Check if character is in a specific zone and trigger callbacks
	 * @param {number} x - Character X position (0-100)
	 * @param {number} y - Character Y position (0-100)
	 */
	checkZones(x, y) {
		const chapter = this.options.getChapterData();
		if (!chapter) return;

		// Theme Zones (Dark/Light based on Y position)
		if (chapter.hasThemeZones && this.options.hasCollectedItem()) {
			const theme = this.getThemeForPosition(x, y);
			this.options.onThemeChange(theme);
		}

		// Context Zones (Legacy/New API)
		if (chapter.hasHotSwitch) {
			const context = this.getContextForPosition(x, y);
			this.options.onContextChange(context);
		}
	}

	/**
	 * Get theme mode based on position (Level 2)
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @returns {ThemeMode} 'dark' or 'light'
	 */
	getThemeForPosition(x, y) {
		if (y <= GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT) {
			return "dark";
		}
		return "light";
	}

	/**
	 * Get context zone based on position (Level 6)
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @returns {HotSwitchState} 'legacy', 'new', or null
	 */
	getContextForPosition(x, y) {
		const legacyZone = { xMin: 50, xMax: 100, yMin: 40, yMax: 100 };
		const newZone = { xMin: 0, xMax: 50, yMin: 40, yMax: 100 };

		if (
			x >= legacyZone.xMin &&
			x <= legacyZone.xMax &&
			y >= legacyZone.yMin &&
			y <= legacyZone.yMax
		) {
			return "legacy";
		} else if (
			x >= newZone.xMin &&
			x < newZone.xMax &&
			y >= newZone.yMin &&
			y <= newZone.yMax
		) {
			return "new";
		}

		return null; // Neutral zone
	}
}
