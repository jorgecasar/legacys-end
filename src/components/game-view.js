import { css, html, LitElement } from "lit";
import "./game-hud.js";
import "./hero-profile.js";
import "./npc-element.js";
import "./reward-element.js";
import "./game-viewport.js";
import "./level-dialog.js";
import "./pause-menu.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { sharedStyles } from "../styles/shared.js";

/**
 * @element game-view
 * @property {Object} currentConfig
 * @property {Boolean} isPaused
 * @property {Number} currentChapterNumber
 * @property {Number} totalChapters
 * @property {String} questTitle
 * @property {Object} heroPos
 * @property {Boolean} isEvolving
 * @property {String} hotSwitchState
 * @property {Boolean} hasCollectedItem
 * @property {String} lockedMessage
 * @property {Boolean} isCloseToTarget
 * @property {Boolean} showDialog
 * @property {String} level
 * @property {Boolean} isLastChapter
 * @property {Boolean} isRewardCollected
 */
export class GameView extends LitElement {
	static properties = {
		gameState: { type: Object },
	};

	render() {
		const { config, ui, quest, hero, levelState } = this.gameState || {};

		if (!config) {
			return html`<div>Loading level data...</div>`;
		}

		// Replaced hardcoded levels with flags
		const _canToggleTheme = config.canToggleTheme;
		const _hasHotSwitch = config.hasHotSwitch;
		const _isFinalBoss = config.isFinalBoss;

		// Dialog Config Logic
		const dialogConfig = config;

		return html`

			<pause-menu
				.open="${ui?.isPaused}"
				@resume="${() => this.dispatchEvent(new CustomEvent("resume"))}"
				@restart="${() => this.dispatchEvent(new CustomEvent("restart"))}"
				@quit="${() => this.dispatchEvent(new CustomEvent("quit"))}"
			></pause-menu>

			<main>
				<game-viewport
					.currentConfig="${config}"
					.heroPos="${hero?.pos}"
					.isEvolving="${hero?.isEvolving}"
					.hotSwitchState="${hero?.hotSwitchState}"
					.hasCollectedItem="${levelState?.hasCollectedItem}"
					.isRewardCollected="${levelState?.isRewardCollected}"
					.lockedMessage="${ui?.lockedMessage}"
					.isCloseToTarget="${levelState?.isCloseToTarget}"
					.currentChapterNumber="${quest?.chapterNumber}" 
					.totalChapters="${quest?.totalChapters}"
					.questTitle="${quest?.title}"
				></game-viewport>
			</main>

			${
				ui?.showDialog
					? html`
				<level-dialog
					.config="${dialogConfig}"
					.level="${quest?.levelId}"
					.hotSwitchState="${hero?.hotSwitchState}"
					@complete="${() => this.dispatchEvent(new CustomEvent("complete"))}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	static styles = [
		...sharedStyles,
		css`
		:host {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100vh;
			width: 100vw;
			background-color: var(--wa-color-neutral-fill-loud);
			background-image: linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px);
			background-size: 40px 40px;
			color: var(--wa-color-text-normal);
			position: relative;
			overflow: hidden;
			font-family: var(--wa-font-family-body);
			box-sizing: border-box;
		}

		main {
			width: 100%;
			max-width: 90rem;
			height: 100%;
			max-height: calc(100vh - 2rem);
			border-left: var(--wa-border-width-l) solid var(--wa-color-neutral-fill-loud);
			border-right: var(--wa-border-width-l) solid var(--wa-color-neutral-fill-loud);
			box-shadow: var(--wa-shadow-large);
			position: relative;
			transition: all 1s;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
		}

	`,
	];
}

customElements.define("game-view", GameView);
