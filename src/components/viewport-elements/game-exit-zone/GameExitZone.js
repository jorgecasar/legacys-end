import { html, LitElement } from "lit";
import { GAME_CONFIG } from "../../../constants/game-config.js";
import { gameExitZoneStyles } from "./GameExitZone.styles.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";

/**
 * @element game-exit-zone
 * @summary Displays the exit zone when available.
 * @property {Object} zoneConfig - The config object for the exit zone {x, y, width, height, label}.
 * @property {Boolean} active - Whether the exit zone is active (e.g. item collected).
 * @attribute active
 */
/**
 * @typedef {import('../../../content/quests/quest-types.js').Zone} Zone
 */

export class GameExitZone extends LitElement {
	static styles = gameExitZoneStyles;

	static properties = {
		zoneConfig: { type: Object },
		active: { type: Boolean },
	};

	constructor() {
		super();
		/** @type {Zone} */
		this.zoneConfig = /** @type {Zone} */ ({});
		this.active = false;
	}

	render() {
		if (!this.active || !this.zoneConfig) return "";

		const { x, y, width, height, label } = this.zoneConfig;
		this.style.left = `${x}%`;
		this.style.top = `${y}%`;
		this.style.width = `${width}%`;
		this.style.height = `${height}%`;
		// Determine layout based on position relative to legacy/new zones
		const isRight = x > GAME_CONFIG.VIEWPORT.ZONES.LEGACY.minX;
		const isLeft = x < GAME_CONFIG.VIEWPORT.ZONES.NEW.maxX;

		this.style.justifyContent = isRight
			? "flex-end"
			: isLeft
				? "flex-start"
				: "center";
		this.style.paddingRight = isRight ? "1rem" : "0";
		this.style.paddingLeft = isLeft ? "1rem" : "0";

		return html`
			<wa-tag size="small" variant="neutral" class="exit-text">${label || "EXIT"}</wa-tag>
		`;
	}
}
