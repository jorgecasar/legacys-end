import "@awesome.me/webawesome/dist/components/button/button.js";
import { html, LitElement } from "lit";
import { processImagePath } from "../../utils/process-assets.js";
import { styles } from "./victory-screen.css.js";

/**
 * @typedef {import("../../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../../content/quests/quest-types.js").RewardConfig} RewardConfig
 */

export class VictoryScreen extends LitElement {
	static properties = {
		quest: { type: Object },
		onReturn: { type: Function },
	};

	constructor() {
		super();
		/** @type {Quest | null} */
		this.quest = null;
		this.onReturn = () => {};
	}

	render() {
		if (!this.quest) {
			return html`<div>Error: No quest data for completion screen.</div>`;
		}

		// Collect all rewards from chapters
		/** @type {Array<RewardConfig>} */
		const collectedRewards = [];
		if (this.quest.chapterIds && this.quest.chapters) {
			this.quest.chapterIds.forEach((chapterId) => {
				const chapter = this.quest.chapters[chapterId];
				if (chapter?.reward) {
					collectedRewards.push(chapter.reward);
				}
			});
		}

		return html`
			<div class="victory-screen">
				<h1 class="victory-title">QUEST COMPLETE!</h1>
				<p class="victory-text"><small>
					Congratulations, hero! You have successfully completed the quest:
					<span style="color: ${this.quest.color || "white"};">${this.quest.name}</span>.
				</small></p>

				<div class="rewards-container">
					${collectedRewards.map(
						(reward) => html`
						<div class="reward-item">
							<img src="${processImagePath(reward.image)}" alt="${reward.name}" class="reward-img" />
							<span class="reward-name">${reward.name}</span>
						</div>
					`,
					)}
				</div>

				<p class="victory-text"><small>
					You earned the badge: <b>"${this.quest.reward.badge}"</b>
					<br/>
					Ability gained: <b>"${this.quest.reward.ability}"</b>
				</small></p>
				<wa-button class="ng-btn" @click="${this.onReturn}">
					RETURN TO HUB
				</wa-button>
			</div>
		`;
	}

	static styles = styles;
}

customElements.define("victory-screen", VictoryScreen);
