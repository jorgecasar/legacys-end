import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { questControllerContext } from "../../../contexts/quest-controller-context.js";
import { themeContext } from "../../../contexts/theme-context.js";
import {
	HotSwitchStates,
	ThemeModes,
	ZoneTypes,
} from "../../../core/constants.js";
import { heroStateContext } from "../../../game/contexts/hero-context.js";
import { gameZoneIndicatorStyles } from "./GameZoneIndicator.styles.js";

/**
 * @typedef {import("../../../content/quests/quest-types.js").Zone} Zone
 */

/**
 * @element game-zone-indicator
 * @summary Displays generic zones (Theme, Context) based on configuration.
 * @property {Zone[]} zones - The list of zones to render.
 * @property {String} type - The type of zones to filter and render (e.g. 'THEME_CHANGE', 'CONTEXT_CHANGE').
 */
export class GameZoneIndicator extends SignalWatcher(LitElement) {
	/** @type {import('../../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../../services/interfaces.js').IThemeService} */
	@consume({ context: themeContext, subscribe: true })
	accessor themeService =
		/** @type {import('../../../services/interfaces.js').IThemeService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../../game/interfaces.js').IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState =
		/** @type {import('../../../game/interfaces.js').IHeroStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @override */
	static styles = gameZoneIndicatorStyles;

	/** @override */
	static properties = {
		type: { type: String },
		zones: { type: Array },
	};

	constructor() {
		super();
		this.type = "";
		/** @type {Zone[]} */
		this.zones = [];
	}

	/**
	 * @param {Zone} zone
	 */
	getStyle(zone) {
		return {
			left: `${zone.x}%`,
			top: `${zone.y}%`,
			width: `${zone.width}%`,
			height: `${zone.height}%`,
		};
	}

	/**
	 * @param {Zone} zone
	 */
	renderThemeZone(zone) {
		const isDark = zone.payload === ThemeModes.DARK;
		const label = isDark ? "Dark Theme" : "Light Theme";
		const className = isDark ? "zone-theme-dark" : "zone-theme-light";

		return html`
			<div class="zone ${className}" style="${styleMap(this.getStyle(zone))}">
				<small class="zone-theme-label">${label}</small>
			</div>
		`;
	}

	/**
	 * @param {Zone} zone
	 */
	renderContextZone(zone) {
		if (zone.payload === null) return "";

		const isLegacy = zone.payload === HotSwitchStates.LEGACY;
		const baseClass = isLegacy ? "zone-context-legacy" : "zone-context-new";
		const title = isLegacy ? "Legacy" : "New API V2";
		const sub = isLegacy ? "LegacyUserService" : "NewUserService";

		// Match original colors
		const legacyColorInactive = "#991b1b"; // Red 800
		const legacyTitleInactive = "#7f1d1d"; // Red 900
		const newColorInactive = "#1e40af"; // Blue 800
		const newTitleInactive = "#1e3a8a"; // Blue 900

		// Check active state
		const currentState =
			this.type === ZoneTypes.THEME_CHANGE
				? this.themeService?.themeMode.get()
				: this.type === ZoneTypes.CONTEXT_CHANGE
					? this.heroState?.hotSwitchState.get()
					: "";

		const isActive = currentState ? currentState === zone.payload : false;
		const stateClass = isActive ? "active" : "inactive";

		// Dynamic text colors
		const titleColor = isActive
			? "white"
			: isLegacy
				? legacyTitleInactive
				: newTitleInactive;
		const subColor = isLegacy ? legacyColorInactive : newColorInactive;

		return html`
			<div class="zone zone-context ${baseClass} ${stateClass}" style="${styleMap(this.getStyle(zone))}">
				<h6 class="ctx-title" style="color: ${titleColor}">${title}</h6>
				<small class="ctx-sub" style="color: ${subColor}">${sub}</small>
			</div>
		`;
	}

	/** @override */
	render() {
		/** @type {Zone[]} */
		const zones = this.zones || [];
		if (zones.length === 0) return "";

		const relevantZones = zones.filter((z) => z.type === this.type);

		return html`
			${relevantZones.map((zone) => {
				if (this.type === ZoneTypes.THEME_CHANGE)
					return this.renderThemeZone(zone);
				if (this.type === ZoneTypes.CONTEXT_CHANGE)
					return this.renderContextZone(zone);
				return "";
			})}
		`;
	}
}
