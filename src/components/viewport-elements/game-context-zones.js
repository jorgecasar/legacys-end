import { css, html, LitElement } from "lit";
import { sharedStyles } from "../../styles/shared.js";

/**
 * @element game-context-zones
 * @summary Displays legacy and new context zones.
 * @property {Boolean} active - Whether context zones are active for this chapter.
 * @attribute active
 * @property {String} state - Current hot switch state ('legacy' | 'new').
 */
export class GameContextZones extends LitElement {
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
				<h6 class="ctx-title" style="color: ${isLegacyActive ? "white" : "#991b1b"}">Legacy</h6>
				<small class="ctx-sub" style="color: #fca5a5">LegacyUserService</small>
			</div>
			<div class="ctx-zone ctx-new ${isNewActive ? "active" : "inactive"}">
				<h6 class="ctx-title" style="color: ${isNewActive ? "white" : "#1e40af"}">New API V2</h6>
				<small class="ctx-sub" style="color: #93c5fd">NewUserService</small>
			</div>
		`;
	}

	static styles = [
		sharedStyles,
		css`
			/* Level 6 Zones */
			.ctx-zone {
				position: absolute;
				top: 43%;
				bottom: 0;
				width: 50%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: flex-start;
				padding: var(--wa-space-m);
				border-radius: var(--wa-border-radius-circle);
				border: var(--wa-border-width-s) solid
					var(--wa-color-neutral-border-normal);
				transition: all 0.5s;
			}
			.ctx-legacy {
				left: 50%;
			}
			.ctx-new {
				left: 0%;
			}

			.ctx-legacy.inactive {
				border: var(--wa-border-width-s) solid
					var(--wa-color-danger-border-normal);
				background-color: color-mix(
					in oklab,
					var(--wa-color-danger-fill-loud) 0%,
					transparent
				);
			}
			.ctx-legacy.active {
				border: var(--wa-border-width-l) solid
					var(--wa-color-danger-border-loud);
				background-color: color-mix(
					in oklab,
					var(--wa-color-danger-fill-loud) 10%,
					transparent
				);
			}

			.ctx-new.inactive {
				border: var(--wa-border-width-s) solid
					var(--wa-color-brand-border-normal);
				background-color: color-mix(
					in oklab,
					var(--wa-color-brand-fill-loud) 0%,
					transparent
				);
			}
			.ctx-new.active {
				border: var(--wa-border-width-l) solid
					var(--wa-color-brand-border-loud);
				background-color: color-mix(
					in oklab,
					var(--wa-color-brand-fill-loud) 10%,
					transparent
				);
			}

			.ctx-title {
				font-weight: bold;
				text-transform: uppercase;
				margin-bottom: var(--wa-space-xs);
				margin-top: 0;
			}
		`,
	];
}

customElements.define("game-context-zones", GameContextZones);
