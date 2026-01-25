import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { Signal, SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { UIEvents } from "../../../core/events.js";
import { gameControlsStyles } from "./GameControls.styles.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";

/**
 * @element game-controls
 * @summary Displays game controls instructions.
 */
export class GameControls extends SignalWatcher(LitElement) {
	/** @override */
	static styles = gameControlsStyles;

	/** @override */
	static properties = {
		isVoiceActive: { type: Boolean },
		touch: { type: Object },
	};

	#hasTouch = window.matchMedia("(pointer: coarse)").matches;
	#hasKeyboard = window.matchMedia("(any-pointer: fine)").matches;
	#viewMode = new Signal.State(this.#hasTouch ? "touch" : "keyboard");

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		this.isVoiceActive = false;
		/** @type {import('../../../controllers/touch-controller.js').TouchController | null} */
		this.touch = null;
	}

	/** @override */
	render() {
		const mode = this.#viewMode.get();

		return html`
			<div class="controls-container">
				${mode === "touch" ? this.touch?.render() : ""}
				
				<div class="instructions-wrapper">
					<wa-details class="controls-details" open>
						<div slot="summary">${msg("CONTROLS")}</div>
						<div class="details-content">
							${this.#renderModeToggle()}
							${
								mode === "keyboard"
									? html`
									<p>${msg("ARROWS TO MOVE")}</p>
									<p>${msg("SPACE TO INTERACT")}</p>
									<p>${msg("ESC TO MENU")}</p>
								`
									: html`
									<p>${msg("DRAG JOYSTICK TO MOVE")}</p>
									<p>${msg("TAP JOYSTICK TO INTERACT")}</p>
								`
							}
						</div>
					</wa-details>
				</div>
				
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

	#renderModeToggle() {
		// Only show toggle if it's a hybrid device (both touch and keyboard/mouse)
		if (!(this.#hasTouch && this.#hasKeyboard)) return html``;

		return html`
			<wa-button-group class="mode-toggle" @click="${(/** @type {Event} */ e) => e.stopPropagation()}">
				<wa-button 
					size="small" 
					variant="${this.#viewMode.get() === "keyboard" ? "brand" : "neutral"}"
					@click="${() => this.#viewMode.set("keyboard")}"
				>
					<wa-icon name="keyboard"></wa-icon>
				</wa-button>
				<wa-button 
					size="small" 
					variant="${this.#viewMode.get() === "touch" ? "brand" : "neutral"}"
					@click="${() => this.#viewMode.set("touch")}"
				>
					<wa-icon name="fingerprint"></wa-icon>
				</wa-button>
			</wa-button-group>
		`;
	}

	_toggleVoice() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.TOGGLE_VOICE, {
				bubbles: true,
				composed: true,
			}),
		);
	}
}
