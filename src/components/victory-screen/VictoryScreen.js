import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { processImagePath } from "../../utils/process-assets.js";
import { victoryScreenStyles } from "./VictoryScreen.styles.js";

/**
 * @typedef {import("../../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../../content/quests/quest-types.js").RewardConfig} RewardConfig
 */

/**
 * @element victory-screen
 * @property {Quest} quest
 * @property {Function} onReturn
 */
export class VictoryScreen extends LitElement {
	static properties = {
		quest: { type: Object },
		onReturn: { type: Function },
	};

	static styles = victoryScreenStyles;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		/** @type {Quest | null} */
		this.quest = null;
		this.onReturn = () => {};
	}

	render() {
		if (!this.quest) {
			return html`<div>${msg("Error: No quest data for completion screen.")}</div>`;
		}

		// Collect all rewards from chapters
		/** @type {Array<RewardConfig>} */
		const collectedRewards = [];
		if (this.quest.chapterIds && this.quest.chapters) {
			this.quest.chapterIds.forEach((chapterId) => {
				const chapter = this.quest?.chapters?.[chapterId];
				if (chapter?.reward) {
					collectedRewards.push(chapter.reward);
				}
			});
		}

		return html`
			<div class="victory-screen">
				<h1 class="victory-title">${msg("QUEST COMPLETE!")}</h1>
				<p class="victory-text"><small>
					${msg("Congratulations, hero! You have successfully completed the quest:")}
					<span style="color: ${this.quest.color || "black"};">${this.quest.name}</span>.
				</small></p>

				<ul class="rewards-list" role="list">
					${collectedRewards.map(
						(reward, index) => html`
						<li class="reward-item" style="--index: ${index}">
							<img src="${ifDefined(processImagePath(reward.image))}" alt="${reward.name}" class="reward-img" />
							<span class="reward-name">${reward.name}</span>
						</li>
					`,
					)}
				</ul>

				<p class="victory-text"><small>
					${msg("You earned the badge:")} <b>"${this.quest?.reward?.badge}"</b>
					<br/>
					${msg("Ability gained:")} <b>"${this.quest?.reward?.ability}"</b>
				</small></p>
				<wa-button class="ng-btn" @click="${this.onReturn}">
					<wa-icon slot="start" name="house"></wa-icon>
					${msg("RETURN TO HUB")}
				</wa-button>
			</div>
		`;
	}
}
