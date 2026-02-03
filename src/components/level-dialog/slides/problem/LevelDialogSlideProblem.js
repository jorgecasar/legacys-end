import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { levelDialogStyles } from "../../LevelDialog.styles.js";

/** @typedef {import('../../../../content/quests/quest-types.js').LevelConfig} LevelConfig */

/**
 * @element level-dialog-slide-problem
 */
export class LevelDialogSlideProblem extends SignalWatcher(LitElement) {
	/** @type {string | import('lit').TemplateResult} */
	@property({ type: Object })
	accessor problemDesc = "";

	/** @override */
	static styles = levelDialogStyles;

	/**
	 * @param {LevelConfig} config
	 * @returns {string}
	 */
	static getAccessibilityText(config) {
		return (config?.problemDesc?.toString() || "").replace(/<[^>]*>/g, ""); // Basic tag cleanup
	}

	/** @override */
	render() {
		return html`
			<div class="slide-content-centered">
				<div class="narrative-icon problem-icon">
					<wa-icon name="triangle-exclamation" class="problem-icon-inner"></wa-icon>
				</div>
				<div class="narrative-text">
					${this.problemDesc}
				</div>
			</div>
		`;
	}
}
