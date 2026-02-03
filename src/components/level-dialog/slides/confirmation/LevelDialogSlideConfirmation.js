import { msg, str } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../../../utils/process-assets.js";
import { levelDialogStyles } from "../../LevelDialog.styles.js";

/** @typedef {import('../../../../content/quests/quest-types.js').LevelConfig} LevelConfig */

/**
 * @element level-dialog-slide-confirmation
 */
export class LevelDialogSlideConfirmation extends SignalWatcher(LitElement) {
	/** @type {import('../../../../content/quests/quest-types.js').RewardConfig | undefined} */
	@property({ type: Object })
	accessor reward = undefined;

	/** @override */
	static styles = levelDialogStyles;

	/**
	 * @param {LevelConfig} config
	 * @returns {string}
	 */
	static getAccessibilityText(config) {
		const levelCompleteText = msg("Level Complete!");
		const rewardText = config?.reward?.name
			? msg(str`You have obtained ${config.reward.name}.`)
			: "";
		return `${levelCompleteText} ${rewardText}`.trim();
	}

	/** @override */
	render() {
		return html`
			<div class="slide-content-between">
				<div></div>
				<div class="quest-complete-container">
					<h2 class="quest-complete-title">${msg("Level Complete!")}</h2>
					${
						this.reward
							? html`
							<div class="reward-preview">
								<img 
									src="${ifDefined(processImagePath(this.reward.image))}" 
									srcset="${ifDefined(processImageSrcset(this.reward.image))}"
									sizes="(max-width: 600px) 200px, 400px"
									alt="${this.reward.name}" 
									class="reward-img" 
								/>
								<div class="reward-info">
									<h6 class="reward-name">${this.reward.name}</h6>
									<p class="reward-desc">${msg("Acquired! This item has been added to your inventory.")}</p>
								</div>
							</div>
						`
							: nothing
					}
				</div>
				<div class="spacer-top"></div>
			</div>
		`;
	}
}
