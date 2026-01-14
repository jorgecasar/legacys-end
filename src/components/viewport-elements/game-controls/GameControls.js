import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { html, LitElement } from "lit";
import { gameControlsStyles } from "./GameControls.styles.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * @element game-controls
 * @summary Displays game controls instructions.
 */
export class GameControls extends LitElement {
	static styles = gameControlsStyles;

	static properties = {
		isVoiceActive: { type: Boolean },
	};

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		this.isVoiceActive = false;
	}

	render() {
		return html`
			<div class="controls-container">
				<wa-details class="controls-details">
					<div slot="summary">${msg("CONTROLS")}</div>
					<p>${msg("ARROWS TO MOVE")}</p>
					<p>${msg("SPACE TO INTERACT")}</p>
					<p>${msg("ESC TO MENU")}</p>
				</wa-details>
				
				<wa-button 
					variant="neutral" 
					size="small" 
					class="voice-toggle ${this.isVoiceActive ? "active" : ""}"
					@click="${this._toggleVoice}"
				>
					<wa-icon slot="start" name="${this.isVoiceActive ? "microphone" : "microphone-slash"}"></wa-icon>
					${msg("Voice Control")}
				</wa-button>
			</div>
		`;
	}

	_toggleVoice() {
		this.dispatchEvent(
			new CustomEvent("toggle-voice", {
				bubbles: true,
				composed: true,
			}),
		);
	}
}
