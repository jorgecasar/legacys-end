import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { html, LitElement } from "lit";
import { styles } from "./pause-menu.css.js";

export class PauseMenu extends LitElement {
	static properties = {
		open: { type: Boolean },
	};

	constructor() {
		super();
		this.open = false;
	}

	render() {
		return html`
			<wa-dialog 
				label="PAUSED" 
				?open="${this.open}"
				style="--width: 320px;"
				@wa-request-close="${this.handleRequestClose}"
			>
				<div class="menu-buttons">
					<wa-button variant="brand" class="menu-btn" @click="${this.dispatchResume}">
						<wa-icon slot="start" name="play"></wa-icon> RESUME GAME
					</wa-button>
					
					<wa-button variant="neutral" class="menu-btn" @click="${this.dispatchRestart}">
						<wa-icon slot="start" name="rotate-left"></wa-icon> RESTART QUEST
					</wa-button>
					
					<wa-button variant="danger" class="menu-btn" @click="${this.dispatchQuit}">
						<wa-icon slot="start" name="door-open"></wa-icon> RETURN TO HUB
					</wa-button>
				</div>
			</wa-dialog>
		`;
	}

	/**
	 * @param {CustomEvent} event
	 */
	handleRequestClose(event) {
		// Only allow closing via Resume button or external logic (which updates .open)
		// If the user clicks overlay or escape, we treat it as "Resume"
		if (
			event.detail.source === "overlay" ||
			event.detail.source === "keyboard"
		) {
			this.dispatchResume();
		}
	}

	dispatchResume() {
		this.dispatchEvent(
			new CustomEvent("resume", { bubbles: true, composed: true }),
		);
	}

	dispatchRestart() {
		this.dispatchEvent(
			new CustomEvent("restart", { bubbles: true, composed: true }),
		);
	}

	dispatchQuit() {
		this.dispatchEvent(
			new CustomEvent("quit", { bubbles: true, composed: true }),
		);
	}

	static styles = styles;
}

customElements.define("pause-menu", PauseMenu);
