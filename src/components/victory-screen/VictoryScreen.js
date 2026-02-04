import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { consume } from "@lit/context";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { loggerContext } from "../../contexts/logger-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { processImagePath } from "../../utils/process-assets.js";
import { victoryScreenStyles } from "./VictoryScreen.styles.js";

/**
 * @typedef {import("../../services/quest-registry-service.js").Quest} Quest
 * @typedef {import("../../content/quests/quest-types.js").RewardConfig} RewardConfig
 * @typedef {import("../../services/interfaces.js").ILoggerService} ILoggerService
 */

/**
 * @element victory-screen
 * @property {Quest} quest
 * @property {Function} onReturn
 * @extends {LitElement}
 */
export class VictoryScreen extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {import('../../services/session-service.js').SessionService} */
	@consume({ context: sessionContext, subscribe: true })
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
		/** @type {unknown} */ (null)
	);

	/** @override */
	static styles = victoryScreenStyles;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	/** @override */
	render() {
		const quest = this.sessionService?.currentQuest.get();
		if (!quest) {
			return html`<div>${msg("Error: No quest data for completion screen.")}</div>`;
		}

		// Collect all rewards from chapters
		/** @type {Array<RewardConfig>} */
		const collectedRewards = [];
		if (quest.chapterIds && quest.chapters) {
			quest.chapterIds.forEach((chapterId) => {
				const chapter = quest?.chapters?.[chapterId];
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
					<strong>${quest.name}</strong>.
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
					${msg("You earned the badge:")} <b>"${quest?.reward?.badge}"</b>
					<br/>
					${msg("Ability gained:")} <b>"${quest?.reward?.ability}"</b>
				</small></p>
				<wa-button class="ng-btn" @click="${() => this.questController?.returnToHub()}">
					<wa-icon slot="start" name="house"></wa-icon>
					${msg("RETURN TO HUB")}
				</wa-button>
			</div>
		`;
	}
}
