import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { levelDialogStyles } from "../LevelDialog.styles.js";

/**
 * @element level-dialog-footer
 */
export class LevelDialogFooter extends SignalWatcher(LitElement) {
	/**
	 * @type {string[]}
	 * @public
	 */
	@property({ type: Array })
	accessor slides = [];

	/**
	 * @type {number}
	 * @public
	 */
	@property({ type: Number })
	accessor currentSlideIndex = 0;

	/** @override */
	static styles = levelDialogStyles;

	/** @override */
	render() {
		return html`
			<div class="dialog-footer">
				<wa-button 
					.variant="${"neutral"}"
					?disabled="${this.currentSlideIndex === 0}"
					@click="${() => this.dispatchEvent(new CustomEvent("prev"))}"
				>
					<wa-icon slot="start" name="arrow-left"></wa-icon> ${msg("PREV")}
				</wa-button>
				
				<!-- Indicators -->
				<div class="indicators">
					${this.slides.map(
						(_, i) => html`
							<div class="indicator ${i === this.currentSlideIndex ? "active" : "inactive"}"></div>
						`,
					)}
				</div>
				
				${
					this.currentSlideIndex === this.slides.length - 1
						? html`
						<wa-button 
							id="evolve-btn"
							.variant="${"brand"}"
							class="complete-btn"
							@click="${() => this.dispatchEvent(new CustomEvent("complete"))}"
							style="--border-radius: 0; animation: bounce 1s infinite;"
						>
							<span>${msg("EVOLVE")} <wa-icon slot="end" name="arrow-right"></wa-icon></span>
						</wa-button>
					`
						: html`
						<wa-button 
							id="next-btn"
							.variant="${"brand"}"
							@click="${() => this.dispatchEvent(new CustomEvent("next"))}"
						>
							<span>${msg("NEXT")} <wa-icon slot="end" name="arrow-right"></wa-icon></span>
						</wa-button>
					`
				}
			</div>
		`;
	}
}

if (!customElements.get("level-dialog-footer")) {
	customElements.define("level-dialog-footer", LevelDialogFooter);
}
