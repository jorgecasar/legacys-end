import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import { html, LitElement, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import {
	getDifficultyVariant,
	getQuestVariant,
} from "../../../../utils/quest-variants.js";
import { questCardStyles } from "./QuestCard.styles.js";

/**
 * @typedef {import('../../../../content/quests/quest-types.js').EnrichedQuest} EnrichedQuest
 */

/**
 * QuestCard - Individual quest card component
 *
 * Displays a single quest with:
 * - Progress indicators
 * - Lock status
 * - Badges for difficulty and completion
 * - Action buttons (Start, Continue, Restart)
 *
 * @element quest-card
 * @property {EnrichedQuest} quest - The quest data to display
 * @property {boolean} isComingSoon - Whether this is a coming soon quest
 * @fires quest-select - Fired when the user starts a quest
 * @fires quest-continue - Fired when the user continues a quest
 */
export class QuestCard extends LitElement {
	static styles = questCardStyles;

	static properties = {
		quest: { type: Object },
		isComingSoon: { type: Boolean },
	};

	constructor() {
		super();
		/** @type {EnrichedQuest} */
		this.quest = /** @type {EnrichedQuest} */ ({});
		this.isComingSoon = false;
	}

	/**
	 * Handles quest selection
	 */
	#handleQuestAction() {
		const progress = this.quest.progress || 0;
		const eventName = progress > 0 ? "quest-continue" : "quest-select";
		this.dispatchEvent(
			new CustomEvent(eventName, {
				detail: { questId: this.quest.id },
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * Handles quest restart
	 */
	#handleRestart() {
		this.dispatchEvent(
			new CustomEvent("quest-select", {
				detail: { questId: this.quest.id },
				bubbles: true,
				composed: true,
			}),
		);
	}

	render() {
		const progress = this.quest.progress || 0;
		const completed = this.quest.isCompleted || false;
		const locked = this.quest.isLocked || this.isComingSoon;
		const isCurrent = this.quest.inProgress || false;
		const variant = getQuestVariant(this.quest);

		return html`
			<wa-card
				class=${classMap({
					"quest-card": true,
					locked: locked,
					completed: completed,
					current: isCurrent,
					[`variant-${variant}`]: true,
				})}
				.appearance="${completed ? "filled" : "outlined"}"
			>
				<h5 slot="header" class="quest-header">${this.quest.name}</h5>
				<wa-icon slot="header-actions" .name="${this.quest.icon || "box"}"></wa-icon>

				<div class="quest-content">
					${
						this.quest.subtitle
							? html`
							<h6 class="quest-subtitle">${this.quest.subtitle}</h6>
						`
							: ""
					}
					
					<p class="quest-description">${this.quest.description}</p>
					
					${
						!locked
							? html`
							<div style="display: flex; justify-content: space-between; font-size: var(--wa-font-size-2xs); margin-bottom: var(--wa-space-3xs);">
								<span>Progress</span>
								<span>${Math.round(progress)}%</span>
							</div>
							<wa-progress-bar .value="${progress}" style="--height: 6px;"></wa-progress-bar>
						`
							: ""
					}
				</div>
				<div slot="footer" class="wa-stack wa-gap-0">
					<span class="quest-time">
						<wa-icon name="clock"></wa-icon> ${this.quest.estimatedTime}
					</span>
					<wa-badge .variant="${getDifficultyVariant(this.quest.difficulty || "beginner")}">
						${this.quest.difficulty}
					</wa-badge>
				</div>

				
				${
					locked
						? html`
					${
						this.isComingSoon
							? html`
							<p class="quest-desc">Coming soon in the next update!</p>
							<wa-button slot="footer-actions" ?disabled="${true}" .variant="${"neutral"}">
								Coming Soon
							</wa-button>
						`
							: html`
							<wa-button slot="footer-actions" .variant="${"neutral"}" ?disabled="${true}">
								<wa-icon slot="start" name="lock"></wa-icon> Locked
							</wa-button>
						`
					}
				`
						: nothing
				}

				${
					!locked && completed
						? html`
					<wa-button slot="footer-actions" .variant="${"success"}" @click="${this.#handleRestart}">
						<wa-icon slot="start" name="rotate-right"></wa-icon> Restart
					</wa-button>
				`
						: ""
				}

				${
					!locked && !completed
						? html`
						<wa-button 
							slot="footer-actions" 
							.variant="${"brand"}" 
							@click="${this.#handleQuestAction}"
						>
							<wa-icon slot="start" name="play"></wa-icon> ${progress > 0 ? "Continue" : "Start"}
						</wa-button>
				`
						: ""
				}
			</wa-card>
		`;
	}
}
