import { LitElement, html, css } from 'lit';
import './hero-profile.js';
import './npc-element.js';
import './reward-element.js';
import './game-hud.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import { sharedStyles } from '../styles/shared.js';

export class GameViewport extends LitElement {
	static properties = {
		currentConfig: { type: Object },
		heroPos: { type: Object },
		isEvolving: { type: Boolean },
		hotSwitchState: { type: String },
		hasCollectedItem: { type: Boolean },
		lockedMessage: { type: String },
		isCloseToTarget: { type: Boolean },
		currentChapterNumber: { type: Number },
		totalChapters: { type: Number },
		questTitle: { type: String },
		isAnimatingReward: { state: true },
		rewardAnimState: { state: true },
		isRewardCollected: { state: true }
	};

	willUpdate(changedProperties) {
		if (changedProperties.has('hasCollectedItem')) {
			if (!this.hasCollectedItem) {
				this.isRewardCollected = false;
			} else if (this.hasCollectedItem) {
				this.isAnimatingReward = true;
				this.rewardAnimState = 'start';
				// ... animation logic ...
			}
		}

		if (changedProperties.has('hasCollectedItem') && this.hasCollectedItem) {
			// Step 1: Grow to center
			setTimeout(() => {
				this.rewardAnimState = 'growing';
				this.requestUpdate();
			}, 50);

			// Step 2: Move to hero
			setTimeout(() => {
				this.rewardAnimState = 'moving';
				this.requestUpdate();
			}, 1000);

			// Step 3: End
			setTimeout(() => {
				this.isAnimatingReward = false;
				this.rewardAnimState = '';
				this.isRewardCollected = true; // New state to trigger visual changes
				console.log('✨ GameViewport dispatching reward-collected');
				this.dispatchEvent(new CustomEvent('reward-collected', { bubbles: true, composed: true }));
				this.requestUpdate();
			}, 1800);
		}
	}

	render() {
		const canToggleTheme = this.currentConfig.canToggleTheme;
		const hasHotSwitch = this.currentConfig.hasHotSwitch;
		const isFinalBoss = this.currentConfig.isFinalBoss;
		const backgroundStyle = this.currentConfig.backgroundStyle || '#374151';

		return html`
			<div class="viewport-container">
				<game-hud 
					.currentChapterNumber="${this.currentChapterNumber}" 
					.totalChapters="${this.totalChapters}"
					.levelTitle="${this.currentConfig.title}"
					.questTitle="${this.questTitle}"
				></game-hud>

				<div class="game-area" style="background: ${backgroundStyle}">
					<wa-details class="controls-details">
						<div slot="summary">CONTROLS</div>
						<p>ARROWS TO MOVE</p>
						<p>SPACE TO INTERACT</p>
						<p>ESC TO MENU</p>
					</wa-details>
					
					<!-- Theme Zones (Level 2 Equivalent) -->
					${canToggleTheme ? html`
						<div class="zone zone-light">
							<small class="zone-label">Light Theme</small>
						</div>
						<div class="zone zone-dark">
							<small class="zone-label">Dark Theme</small>
						</div>
					` : ''}

					<!-- Exit Zone -->
					${this.hasCollectedItem && this.currentConfig.exitZone ? html`
						<div class="exit-zone" style="
							left: ${this.currentConfig.exitZone.x}%; 
							top: ${this.currentConfig.exitZone.y}%; 
							width: ${this.currentConfig.exitZone.width}%; 
							height: ${this.currentConfig.exitZone.height}%;
							justify-content: ${this.currentConfig.exitZone.x > 80 ? 'flex-end' : (this.currentConfig.exitZone.x < 20 ? 'flex-start' : 'center')};
							padding-right: ${this.currentConfig.exitZone.x > 80 ? '1rem' : '0'};
							padding-left: ${this.currentConfig.exitZone.x < 20 ? '1rem' : '0'};
						">
							<wa-tag variant="neutral" class="exit-text">${this.currentConfig.exitZone.label || 'EXIT'}</wa-tag>
						</div>
					` : ''}

					<!-- Context Zones (Level 6 Equivalent) -->
					${hasHotSwitch ? html`
						<div class="ctx-zone ctx-legacy ${this.hotSwitchState === 'legacy' ? 'active' : 'inactive'}">
							<h6 class="ctx-title" style="color: ${this.hotSwitchState === 'legacy' ? 'white' : '#991b1b'}">Legacy</h6>
							<small class="ctx-sub" style="color: #fca5a5">LegacyUserService</small>
						</div>
						<div class="ctx-zone ctx-new ${this.hotSwitchState === 'new' ? 'active' : 'inactive'}">
							<h6 class="ctx-title" style="color: ${this.hotSwitchState === 'new' ? 'white' : '#1e40af'}">New API V2</h6>
							<small class="ctx-sub" style="color: #93c5fd">NewUserService</small>
						</div>
					` : ''}

					<!-- NPC -->
					${this.currentConfig.npc ? html`
						<npc-element
							.name="${this.currentConfig.npc.name}"
							.image="${this.currentConfig.npc.image}"
							.icon="${this.currentConfig.npc.icon}"
							.x="${this.currentConfig.npc.position.x}"
							.y="${this.currentConfig.npc.position.y}"
							.isClose="${this.isCloseToTarget}"
							.action="${this.lockedMessage}"
							.hasCollectedItem="${this.hasCollectedItem}"
						></npc-element>
					` : ''}

						<!-- Reward -->
						${(this.isAnimatingReward || (!this.hasCollectedItem && this.currentConfig.reward)) ? html`
							<reward-element
								.image="${this.currentConfig.reward.image}"
								.icon="${this.currentConfig.reward.icon}"
								.x="${this.isAnimatingReward && this.rewardAnimState === 'growing' ? 50 : (this.isAnimatingReward && this.rewardAnimState === 'moving' ? this.heroPos.x : this.currentConfig.reward.position.x)}"
								.y="${this.isAnimatingReward && this.rewardAnimState === 'growing' ? 50 : (this.isAnimatingReward && this.rewardAnimState === 'moving' ? this.heroPos.y : this.currentConfig.reward.position.y)}"
								class="${this.isAnimatingReward ? this.rewardAnimState : ''}"
							></reward-element>
						` : ''}

					<!-- Alarion -->
					<hero-profile 
						style="
							left: ${this.heroPos.x}%; 
							top: ${this.heroPos.y}%;
							opacity: ${this.isEvolving ? 0 : 1};
							transition: ${this.isEvolving ? 'opacity 0.5s ease-out' : 'left 0.075s linear, top 0.075s linear'};
						"
						.imageSrc="${(this.isRewardCollected && this.currentConfig.hero?.reward) ? this.currentConfig.hero.reward : this.currentConfig.hero?.image}"
						.hotSwitchState="${this.hotSwitchState}"
					></hero-profile>

				</div>
			</div>
		`;
	}

	static styles = [
		...sharedStyles,
		css`
		:host {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			flex: 1;
			min-height: 0;
			container-type: size;
		}

		.viewport-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			max-width: 100%;
			max-height: 100%;
			position: relative;
			overflow: hidden;
			flex: 1;
		}

		.controls-details {
			position: absolute;
			bottom: var(--wa-space-m);
			right: var(--wa-space-m);
			z-index: 10;
			background-color: var(--wa-color-surface-default);
			border-radius: var(--wa-border-radius-m);
			box-shadow: var(--wa-shadow-medium);
			max-width: 200px;
		}

		.controls-details::part(content) {
			padding: var(--wa-space-s) var(--wa-space-m);
		}

		.controls-details::part(summary) {
			font-weight: bold;
			font-size: var(--wa-font-size-xs);
			padding: var(--wa-space-s) var(--wa-space-m);
			text-transform: uppercase;
		}

		/* Force content to expand upwards */
		.controls-details[open] {
			display: flex;
			flex-direction: column-reverse;
		}

		.game-area {
			position: relative;
			aspect-ratio: 1/1;
			/* Try to be as big as possible */
			width: 100vh;
			height: 100vh;
			/* But constrained by wrapper */
			max-width: 100%;
			max-height: 100%;
			flex: 1 1 auto;
			min-height: 0;
			min-width: 0;
			transition: background 1s ease-in-out;
		}

		/* Zone Overlays */
		.zone {
			position: absolute;
			top: 0; bottom: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			align-items: center;
			padding-bottom: 1rem;
		}
		.zone-light { top: 25%; width: 100%; height: 75%; background-color: rgba(255,255,255,0.1); border-right: 2px dashed rgba(255,255,255,0.2); }
		.zone-dark { top: 0%; width: 100%; height: 25%;  background-color: rgba(0,0,0,0.3); }
		.zone-label { color: rgba(255,255,255,0.5); font-weight: bold; text-transform: uppercase; }

		.exit-zone {
			position: absolute;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			transform: translate(-50%, -50%);
		}

		.exit-text {
			position: relative;
			white-space: nowrap;
			animation: bounce 1s infinite;
		}

		/* Level 6 Zones */
		.ctx-zone {
			position: absolute; top: 43%; bottom: 0; width: 50%;
			display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: var(--wa-space-m);
			border-radius: var(--wa-border-radius-circle);
			border: var(--wa-border-width-s) solid var(--wa-color-neutral-border-normal);
			transition: all 0.5s;
		}
		.ctx-legacy { left: 50%; }
		.ctx-new { left: 0%; }
		
		.ctx-legacy.inactive {
			border: var(--wa-border-width-s) solid var(--wa-color-danger-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 0%, transparent);
		}
		.ctx-legacy.active {
			border: var(--wa-border-width-l) solid var(--wa-color-danger-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 10%, transparent);
		}
		
		.ctx-new.inactive {
			border: var(--wa-border-width-s) solid var(--wa-color-brand-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 0%, transparent);
		}
		.ctx-new.active {
			border: var(--wa-border-width-l) solid var(--wa-color-brand-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 10%, transparent);
		}

		.ctx-title { font-weight: bold; text-transform: uppercase; margin-bottom: var(--wa-space-xs); margin-top: 0; }
		.ctx-sub { }

		/* Hero Container */
		hero-profile {
			position: absolute; z-index: 30;
			transform: translate(-50%, -50%);
			will-change: transform, left, top;
			width: 15%;
			aspect-ratio: 1/1;
			pointer-events: none;
		}

		reward-element {
			width: 5%;
			aspect-ratio: 1/1;
			z-index: 20;
			transition: all 0.8s ease-in-out;
		}

		reward-element.growing {
			transform: translate(-50%, -50%) scale(10);
			z-index: 100;
		}

		reward-element.moving {
			transform: translate(-50%, -50%) scale(0.1);
			opacity: 0;
		}

		@keyframes bounce {
			0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
			50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
		}
	`];
}

customElements.define('game-viewport', GameViewport);
