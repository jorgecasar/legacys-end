import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { levelDialogStyles } from "../../LevelDialog.styles.js";

/** @typedef {import('../../../../content/quests/quest-types.js').LevelConfig} LevelConfig */

/**
 * @element level-dialog-slide-analysis
 */
export class LevelDialogSlideAnalysis extends SignalWatcher(LitElement) {
	/**
	 * @type {string[]}
	 * @public
	 */
	@property({ type: Array })
	accessor architecturalChanges = [];

	/** @override */
	static styles = levelDialogStyles;

	/**
	 * @param {LevelConfig} config
	 * @returns {string}
	 */
	static getAccessibilityText(config) {
		return (
			msg("Key architectural changes: ") +
			(config?.architecturalChanges?.join(". ") || "")
		);
	}

	/** @override */
	render() {
		return html`
			<h6 class="slide-title-analysis">${msg("Key Architectural Changes")}</h6>
			<div class="analysis-list">
				${this.architecturalChanges?.map(
					(change) => html`
						<div class="analysis-item">
							<wa-icon name="arrow-right" class="analysis-arrow"></wa-icon>
							<span>${change}</span>
						</div>
					`,
				)}
			</div>
		`;
	}
}
