import { html, LitElement } from "lit";
import { sharedStyles } from "../../styles/shared.js";

/**
 * @element game-theme-zones
 * @summary Displays light and dark theme zones.
 * @property {Boolean} active - Whether theme zones are active for this chapter.
 * @attribute active
 */
export class GameThemeZones extends LitElement {
	static properties = {
		active: { type: Boolean },
	};

	constructor() {
		super();
		this.active = false;
	}

	render() {
		if (!this.active) return "";
		return html`
			<div class="zone zone-light">
				<small class="zone-label">Light Theme</small>
			</div>
			<div class="zone zone-dark">
				<small class="zone-label">Dark Theme</small>
			</div>
		`;
	}

	static styles = [sharedStyles];
}

customElements.define("game-theme-zones", GameThemeZones);
