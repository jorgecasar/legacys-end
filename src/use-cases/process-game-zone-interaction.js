import { GAME_CONFIG } from "../constants/game-config.js";

/**
 * ProcessGameZoneInteractionUseCase
 *
 * Checks if the hero is in specific zones and returns triggers.
 */
export class ProcessGameZoneInteractionUseCase {
	/**
	 * @typedef {Object} ZoneInteractionResult
	 * @property {'THEME_CHANGE' | 'CONTEXT_CHANGE' | 'NONE'} type
	 * @property {any} payload
	 */

	/**
	 * Execute the zone check
	 * @param {Object} params
	 * @param {number} params.x
	 * @param {number} params.y
	 * @param {import('../content/quests/quest-types.js').LevelConfig} [params.chapter]
	 * @param {boolean} params.hasCollectedItem
	 * @returns {ZoneInteractionResult[]}
	 */
	execute({ x, y, chapter, hasCollectedItem }) {
		if (!chapter) return [];

		/** @type {ZoneInteractionResult[]} */
		const results = [];

		// Theme Zones (Dark/Light based on Y position)
		if (chapter.hasThemeZones && hasCollectedItem) {
			const theme = this.getThemeForPosition(x, y);
			results.push({ type: "THEME_CHANGE", payload: theme });
		}

		// Context Zones (Legacy/New API)
		if (chapter.hasHotSwitch) {
			const context = this.getContextForPosition(x, y);
			results.push({ type: "CONTEXT_CHANGE", payload: context });
		}

		return results;
	}

	/**
	 * Get theme mode based on position
	 * @param {number} _x
	 * @param {number} y
	 * @returns {'dark' | 'light'}
	 */
	getThemeForPosition(_x, y) {
		if (y <= GAME_CONFIG.VIEWPORT.ZONES.THEME.DARK_HEIGHT) {
			return "dark";
		}
		return "light";
	}

	/**
	 * Get context zone based on position
	 * @param {number} x
	 * @param {number} y
	 * @returns {'legacy' | 'new' | null}
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
		}

		if (
			x >= newZone.xMin &&
			x < newZone.xMax &&
			y >= newZone.yMin &&
			y <= newZone.yMax
		) {
			return "new";
		}

		return null;
	}
}
