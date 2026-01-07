import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { html, LitElement } from "lit";
import { styles } from "./game-controls.css.js";

/**
 * @element game-controls
 * @summary Displays game controls instructions.
 */
export class GameControls extends LitElement {
	static properties = {
		isVoiceActive: { type: Boolean },
	};

	constructor() {
		super();
		this.isVoiceActive = false;
	}

	render() {
		return html`
			<div class="controls-container">
				<wa-details class="controls-details">
					<div slot="summary">CONTROLS</div>
					<p>ARROWS TO MOVE</p>
					<p>SPACE TO INTERACT</p>
					<p>ESC TO MENU</p>
				</wa-details>
				
				<wa-button 
					variant="neutral" 
					size="small" 
					class="voice-toggle ${this.isVoiceActive ? "active" : ""}"
					@click="${this._toggleVoice}"
				>
					<wa-icon slot="start" name="${this.isVoiceActive ? "microphone" : "microphone-slash"}"></wa-icon>
					Voice Control
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

	static styles = styles;
}

customElements.define("game-controls", GameControls);
