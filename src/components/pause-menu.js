import { LitElement, html, css } from 'lit';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

export class PauseMenu extends LitElement {
	static properties = {
		open: { type: Boolean }
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

	handleRequestClose(event) {
		// Only allow closing via Resume button or external logic (which updates .open)
		// If the user clicks overlay or escape, we treat it as "Resume"
		if (event.detail.source === 'overlay' || event.detail.source === 'keyboard') {
			this.dispatchResume();
		}
	}

	dispatchResume() {
		this.dispatchEvent(new CustomEvent('resume', { bubbles: true, composed: true }));
	}

	dispatchRestart() {
		this.dispatchEvent(new CustomEvent('restart', { bubbles: true, composed: true }));
	}

	dispatchQuit() {
		this.dispatchEvent(new CustomEvent('quit', { bubbles: true, composed: true }));
	}

	static styles = css`
		:host {
			display: block;
		}

		wa-dialog {
			--header-spacing: 1.5rem;
			--body-spacing: 1.5rem;
			--footer-spacing: 0;
		}

		/* Customizing the dialog header to match the game's pixel font style */
		wa-dialog::part(title) {
			font-family: var(--wa-font-family-heading);
			font-size: var(--wa-font-size-m);
			color: #fbbf24;
			text-align: center;
			width: 100%;
			text-shadow: var(--wa-shadow-small);
		}

		/* Hide the close button since we have explicit actions */
		wa-dialog::part(close-button) {
			display: none;
		}

		wa-dialog::part(overlay) {
			background-color: rgba(0, 0, 0, 0.8);
			backdrop-filter: blur(4px);
		}

		wa-dialog::part(panel) {
			background-color: #1f2937;
			border: 4px solid #374151;
			border-radius: 0;
			box-shadow: var(--wa-shadow-large);
		}

		.menu-buttons {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			width: 100%;
		}

		.menu-btn {
			width: 100%;
			--border-radius: 0;
			font-family: var(--wa-font-family-body);
			font-size: var(--wa-font-size-2xs);
		}
	`;
}

customElements.define('pause-menu', PauseMenu);
