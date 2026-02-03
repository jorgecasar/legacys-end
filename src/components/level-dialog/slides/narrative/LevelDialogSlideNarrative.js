import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { levelDialogStyles } from "../../LevelDialog.styles.js";

/** @typedef {import('../../../../content/quests/quest-types.js').LevelConfig} LevelConfig */

/**
 * @element level-dialog-slide-narrative
 */
export class LevelDialogSlideNarrative extends SignalWatcher(LitElement) {
	/**
	 * @type {string | import('lit').TemplateResult}
	 * @public
	 */
	@property({ type: String })
	accessor description = "";

	/** @override */
	static styles = levelDialogStyles;

	/**
	 * @param {LevelConfig} config
	 * @returns {string}
	 */
	static getAccessibilityText(config) {
		return config?.description?.toString() || "";
	}

	/** @override */
	render() {
		return html`
			<div class="slide-content-centered">
				<div class="narrative-icon">
					<wa-icon name="scroll" class="narrative-icon-inner"></wa-icon>
				</div>
				<div class="narrative-text">
					${this.description}
				</div>
			</div>
		`;
	}
}
