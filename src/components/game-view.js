import { LitElement, html, css, nothing } from 'lit';
import './game-hud.js';
import './hero-profile.js';
import './npc-element.js';
import './reward-element.js';
import './game-viewport.js';
import './level-dialog.js';
import './pause-menu.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { sharedStyles } from '../styles/shared.js';

export class GameView extends LitElement {
	static properties = {
		currentConfig: { type: Object },
		isPaused: { type: Boolean },
		currentChapterNumber: { type: Number },
		totalChapters: { type: Number },
		questTitle: { type: String },
		heroPos: { type: Object },
		isEvolving: { type: Boolean },
		hotSwitchState: { type: String },
		hasCollectedItem: { type: Boolean },
		lockedMessage: { type: String },
		isCloseToTarget: { type: Boolean },
		showDialog: { type: Boolean },
		level: { type: String },
		isLastChapter: { type: Boolean },
		isRewardCollected: { type: Boolean }
	};

	render() {
		if (!this.currentConfig) {
			return html`<div>Loading level data...</div>`;
		}

		// Replaced hardcoded levels with flags
		const canToggleTheme = this.currentConfig.canToggleTheme;
		const hasHotSwitch = this.currentConfig.hasHotSwitch;
		const isFinalBoss = this.currentConfig.isFinalBoss;


		// Dialog Config Logic
		let dialogConfig = this.currentConfig;

		return html`

			<pause-menu
				.open="${this.isPaused}"
				@resume="${() => this.dispatchEvent(new CustomEvent('resume'))}"
				@restart="${() => this.dispatchEvent(new CustomEvent('restart'))}"
				@quit="${() => this.dispatchEvent(new CustomEvent('quit'))}"
			></pause-menu>

			<main>
				<game-viewport
					.currentConfig="${this.currentConfig}"
					.heroPos="${this.heroPos}"
					.isEvolving="${this.isEvolving}"
					.hotSwitchState="${this.hotSwitchState}"
					.hasCollectedItem="${this.hasCollectedItem}"
					.isRewardCollected="${this.isRewardCollected}"
					.lockedMessage="${this.lockedMessage}"
					.isCloseToTarget="${this.isCloseToTarget}"
					.currentChapterNumber="${this.currentChapterNumber}" 
					.totalChapters="${this.totalChapters}"
					.questTitle="${this.questTitle}"
				></game-viewport>
			</main>

			${this.showDialog ? html`
				<level-dialog
					.config="${dialogConfig}"
					.level="${this.level}"
					.hotSwitchState="${this.hotSwitchState}"
					@complete="${() => this.dispatchEvent(new CustomEvent('complete'))}"
					@close="${() => this.dispatchEvent(new CustomEvent('close-dialog'))}"
				></level-dialog>
			` : ''}
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

	`];
}

customElements.define('game-view', GameView);
