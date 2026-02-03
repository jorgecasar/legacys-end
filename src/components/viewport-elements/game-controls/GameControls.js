import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { Signal, SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { KeyboardController } from "../../../controllers/keyboard-controller.js";
import { TouchController } from "../../../controllers/touch-controller.js";
import { UIEvents } from "../../../core/events.js";
import { gameControlsStyles } from "./GameControls.styles.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";

import { consume } from "@lit/context";
import { loggerContext } from "../../../contexts/logger-context.js";

/**
 * @element game-controls
 * @summary Displays game controls instructions.
 */
export class GameControls extends SignalWatcher(LitElement) {
	/** @override */
	static styles = gameControlsStyles;

	/** @type {import('../../../services/interfaces.js').ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger =
		/** @type {import('../../../services/interfaces.js').ILoggerService} */ (
			/** @type {unknown} */ (null)
		);

	#hasTouch = window.matchMedia("(pointer: coarse)").matches;
	#hasKeyboard = window.matchMedia("(any-pointer: fine)").matches;
	#viewMode = new Signal.State(this.#hasTouch ? "touch" : "keyboard");

	constructor() {
		super();
		updateWhenLocaleChanges(this);

		/** @type {TouchController} */
		this.touch = new TouchController(this);
		/** @type {KeyboardController} */
		this.keyboard = new KeyboardController(this);

		// Lazy load VoiceController
		/** @type {import('../../../controllers/voice-controller.js').VoiceController | null} */
		this.voice = null;
		this.initVoice();
	}

	async initVoice() {
		const { VoiceController } = await import(
			"../../../controllers/voice-controller.js"
		);
		this.voice = new VoiceController(this);
		this.requestUpdate();
	}

	/**
	 * Handles next chapter command from VoiceController
	 */
	handleLevelComplete() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.COMPLETE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles move to command from VoiceController
	 * @param {number} x
	 * @param {number} y
	 */
	moveTo(x, y) {
		this.dispatchEvent(
			new CustomEvent(UIEvents.MOVE_TO, {
				detail: { x, y },
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles next slide command from VoiceController
	 */
	nextDialogSlide() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.NEXT_SLIDE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles prev slide command from VoiceController
	 */
	prevDialogSlide() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.PREV_SLIDE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles pause input from KeyboardController and VoiceController
	 */
	handlePause() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.TOGGLE_PAUSE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles move input from TouchController
	 * @param {number} dx
	 * @param {number} dy
	 */
	handleMove(dx, dy) {
		this.dispatchEvent(
			new CustomEvent(UIEvents.MOVE, {
				detail: { dx, dy },
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles interact input from TouchController
	 */
	handleInteract() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.INTERACT, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	/** @override */
	render() {
		const mode = this.#viewMode.get();

		return html`
			<div class="controls-container">
				${mode === "touch" ? this.touch.render() : nothing}
				
				<div class="instructions-wrapper">
					<wa-details class="controls-details">
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
					class="voice-toggle ${this.voice?.enabled ? "active" : ""}"
					?loading="${this.voice?.isInitializing}"
					@click="${this._toggleVoice}"
				>
					<wa-icon slot="start" name="${this.voice?.enabled ? "microphone" : "microphone-slash"}"></wa-icon>
					${msg("Voice Control")}
				</wa-button>
			</div>
		`;
	}

	#renderModeToggle() {
		// Only show toggle if it's a hybrid device (both touch and keyboard/mouse)
		if (!(this.#hasTouch && this.#hasKeyboard)) return nothing;

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

	async _toggleVoice() {
		if (this.voice) {
			await this.voice.toggle();
		} else {
			this.logger?.warn("Voice controller not initialized");
		}
	}
}
