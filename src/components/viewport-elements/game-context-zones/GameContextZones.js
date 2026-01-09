import { html, LitElement } from "lit";
import { gameContextZonesStyles } from "./GameContextZones.styles.js";

/**
 * @element game-context-zones
 * @summary Displays legacy and new context zones.
 * @property {Boolean} active - Whether context zones are active for this chapter.
 * @property {String} state - Current hot switch state ('legacy' | 'new').
 * @attribute active
 * @attribute state
 */
export class GameContextZones extends LitElement {
	static styles = gameContextZonesStyles;

	static properties = {
		active: { type: Boolean },
		state: { type: String },
	};

	constructor() {
		super();
		this.active = false;
		this.state = "legacy";
	}

	render() {
		if (!this.active) return "";

		const isLegacyActive = this.state === "legacy";
		const isNewActive = this.state === "new";

		return html`
			<div class="ctx-zone ctx-legacy ${isLegacyActive ? "active" : "inactive"}">
				<h6 class="ctx-title" style="color: ${isLegacyActive ? "white" : "#7f1d1d"}">Legacy</h6>
				<small class="ctx-sub" style="color: #991b1b">LegacyUserService</small>
			</div>
			<div class="ctx-zone ctx-new ${isNewActive ? "active" : "inactive"}">
				<h6 class="ctx-title" style="color: ${isNewActive ? "white" : "#1e3a8a"}">New API V2</h6>
				<small class="ctx-sub" style="color: #1e40af">NewUserService</small>
			</div>
		`;
	}
}
