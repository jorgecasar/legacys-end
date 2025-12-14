/**
 * GameZoneController - Lit Reactive Controller for zone detection
 * 
 * Handles:
 * - Theme zones (dark/light based on Y position) - if chapter.canToggleTheme
 * - Context zones (legacy/new based on position) - if chapter.hasHotSwitch
 * 
 * Usage:
 * ```js
 * this.zones = new GameZoneController(this, {
 *   onThemeChange: (theme) => { this.themeMode = theme; },
 *   onContextChange: (context) => { this.hotSwitchState = context; },
 *   getChapterData: () => currentConfig,
 *   hasCollectedItem: () => this.hasCollectedItem
 * });
 * 
 * // Check zones when position changes
 * this.zones.checkZones(x, y);
 * ```
 */
export class GameZoneController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			onThemeChange: () => { },
			onContextChange: () => { },
			getChapterData: () => null,
			hasCollectedItem: () => false,
			...options
		};

		host.addController(this);
	}

	hostConnected() {
		// No setup needed
	}

	hostDisconnected() {
		// No cleanup needed
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
		if (chapter.canToggleTheme && this.options.hasCollectedItem()) {
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
	 * @returns {string} 'wa-dark' or 'wa-light'
	 */
	getThemeForPosition(x, y) {
		if (y <= 25) {
			return 'dark';
		}
		return 'light';
	}

	/**
	 * Get context zone based on position (Level 6)
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @returns {string|null} 'legacy', 'new', or null (neutral zone)
	 */
	getContextForPosition(x, y) {
		const legacyZone = { xMin: 50, xMax: 100, yMin: 40, yMax: 100 };
		const newZone = { xMin: 0, xMax: 50, yMin: 40, yMax: 100 };

		if (x >= legacyZone.xMin && x <= legacyZone.xMax && y >= legacyZone.yMin && y <= legacyZone.yMax) {
			return 'legacy';
		} else if (x >= newZone.xMin && x < newZone.xMax && y >= newZone.yMin && y <= newZone.yMax) {
			return 'new';
		}

		return null; // Neutral zone
	}
}
