import { consume } from "@lit/context";
import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { loggerContext } from "../../../contexts/logger-context.js";
import { questControllerContext } from "../../../contexts/quest-controller-context.js";
import { themeContext } from "../../../contexts/theme-context.js";
import {
	HotSwitchStates,
	ThemeModes,
	TrafficLightStates,
	ZoneTypes,
} from "../../../core/constants.js";
import { gameStoreContext } from "../../../state/game-store.js";
import { gameZoneIndicatorStyles } from "./GameZoneIndicator.styles.js";

/**
 * @typedef {import("../../../content/quests/quest-types.js").Zone} Zone
 */

/**
 * @element game-zone-indicator
 * @summary Displays generic zones (Theme, Context) based on configuration.
 * @property {Zone[]} zones - The list of zones to render.
 * @property {String} type - The type of zones to filter and render (e.g. 'THEME_CHANGE', 'CONTEXT_CHANGE').
 * @extends {LitElement}
 * @typedef {import('../../../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../../../types/services.d.js').IQuestController} IQuestController
 * @typedef {import('../../../types/services.d.js').IThemeService} IThemeService
 * @typedef {import('../../../types/game.d.js').IHeroStateService} IHeroStateService
 */
export class GameZoneIndicator extends SignalWatcher(LitElement) {
	/** @type {IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController = /** @type {IQuestController} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IThemeService} */
	@consume({ context: themeContext, subscribe: true })
	accessor themeService = /** @type {IThemeService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {import('../../../state/game-store.js').GameStore} */
	@consume({ context: gameStoreContext, subscribe: true })
	accessor gameStore =
		/** @type {import('../../../state/game-store.js').GameStore} */ (
			/** @type {unknown} */ (null)
		);

	get heroState() {
		return this.gameStore?.hero;
	}

	/** @type {ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
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
		const label = isDark ? msg("Dark Theme") : msg("Light Theme");
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
		if (zone.payload === null) return nothing;

		const isLegacy = zone.payload === HotSwitchStates.LEGACY;
		const baseClass = isLegacy ? "zone-context-legacy" : "zone-context-new";
		const title = isLegacy ? msg("Legacy") : msg("New API V2");
		const sub = isLegacy ? msg("LegacyUserService") : msg("NewUserService");

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

	/**
	 * @param {Zone} zone
	 * @param {TrafficLightStates?} lightState
	 */
	renderTrafficLightZone(zone, lightState = null) {
		const currentState = this.heroState?.trafficLightState.get();

		if (lightState !== null) {
			const isOn = currentState === lightState;
			const colorClass =
				lightState === TrafficLightStates.GREEN ? "zone-safe" : "zone-danger";
			const dynamicStyles = {
				...this.getStyle(zone),
				opacity: isOn ? "1" : "0.1",
			};

			return html`
				<div class="zone zone-traffic-light ${colorClass}" style="${styleMap(dynamicStyles)}"></div>
			`;
		}

		if (zone.payload === TrafficLightStates.RED) {
			// Crosswalk zone (Pedestrian button)
			const isSafe = currentState === TrafficLightStates.RED;
			const stateClass = classMap({
				"zone-safe": isSafe,
				"zone-danger": !isSafe,
			});

			return html`
				<div class="zone zone-crosswalk ${stateClass}" style="${styleMap(this.getStyle(zone))}"></div>
			`;
		} else if (zone.payload === null) {
			// Cars zone
			const isSafe = currentState === TrafficLightStates.GREEN;
			const stateClass = classMap({
				"zone-safe": isSafe,
				"zone-danger": !isSafe,
			});

			return html`
				<div class="zone zone-traffic-light ${stateClass}" style="${styleMap(this.getStyle(zone))}"></div>
			`;
		}

		return nothing;
	}

	/** @override */
	render() {
		/** @type {Zone[]} */
		const zones = this.zones || [];
		if (zones.length === 0) return nothing;

		const relevantZones = zones.filter((z) => z.type === this.type);

		return html`
			${relevantZones.map((zone) => {
				if (this.type === ZoneTypes.THEME_CHANGE)
					return this.renderThemeZone(zone);
				if (this.type === ZoneTypes.CONTEXT_CHANGE)
					return this.renderContextZone(zone);
				if (this.type === ZoneTypes.TRAFFIC_LIGHT_CHANGE)
					return this.renderTrafficLightZone(zone);
				if (this.type === ZoneTypes.TRAFFIC_LIGHT_RED)
					return this.renderTrafficLightZone(zone, TrafficLightStates.RED);
				if (this.type === ZoneTypes.TRAFFIC_LIGHT_GREEN)
					return this.renderTrafficLightZone(zone, TrafficLightStates.GREEN);
				return nothing;
			})}
		`;
	}
}
