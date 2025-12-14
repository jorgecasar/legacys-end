import { css, html, LitElement } from "lit";
import { sharedStyles } from "../../styles/shared.js";
import "@awesome.me/webawesome/dist/components/details/details.js";

/**
 * @element game-controls
 * @summary Displays game controls instructions.
 */
export class GameControls extends LitElement {
	render() {
		return html`
			<wa-details class="controls-details">
				<div slot="summary">CONTROLS</div>
				<p>ARROWS TO MOVE</p>
				<p>SPACE TO INTERACT</p>
				<p>ESC TO MENU</p>
			</wa-details>
		`;
	}

	static styles = [
		sharedStyles,
		css`
			:host {
				position: absolute;
				bottom: 1rem;
				right: 1rem;
				z-index: 50;
			}
		`
	];
}

customElements.define("game-controls", GameControls);
