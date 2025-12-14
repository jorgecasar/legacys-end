import { LitElement, html, css } from 'lit';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { sharedStyles } from '../styles/shared.js';

export class VictoryScreen extends LitElement {
	static properties = {
		quest: { type: Object },
		onReturn: { type: Function }
	};

	constructor() {
		super();
		this.quest = null;
		this.onReturn = () => { };
	}

	connectedCallback() {
		super.connectedCallback();
		window.addEventListener('keydown', this.handleKeyDown);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('keydown', this.handleKeyDown);
	}

	handleKeyDown = (e) => {
		if (e.code === 'Space' || e.key === 'Enter') {
			e.preventDefault();
			this.onReturn();
		}
	};

	render() {
		if (!this.quest) {
			return html`<div>Error: No quest data for completion screen.</div>`;
		}

		// Collect all rewards from chapters
		const collectedRewards = [];
		if (this.quest.chapterIds && this.quest.chapters) {
			this.quest.chapterIds.forEach(chapterId => {
				const chapter = this.quest.chapters[chapterId];
				if (chapter && chapter.reward) {
					collectedRewards.push(chapter.reward);
				}
			});
		}

		return html`
			<div class="victory-screen">
				<h1 class="victory-title">QUEST COMPLETE!</h1>
				<p class="victory-text"><small>
					Congratulations, hero! You have successfully completed the quest:
					<span style="color: ${this.quest.color || 'white'};">${this.quest.name}</span>.
				</small></p>

				<div class="rewards-container">
					${collectedRewards.map(reward => html`
						<div class="reward-item">
							<img src="${reward.image}" alt="${reward.name}" class="reward-img" />
							<span class="reward-name">${reward.name}</span>
						</div>
					`)}
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

	static styles = [
		...sharedStyles,
		css`
			:host {
				position: fixed; inset: 0; z-index: 60; background-color: black;
				display: flex; flex-direction: column; align-items: center; justify-content: center;
				color: white; animation: fadeIn 1s ease-in;
				font-family: var(--wa-font-family-body);
			}
			.victory-screen {
				display: flex; flex-direction: column; align-items: center; justify-content: center;
				width: 100%; height: 100%;
			}
			.victory-title { color: var(--wa-color-warning-fill-loud); text-align: center; animation: pulse 2s infinite; margin-bottom: var(--wa-space-l); font-family: 'Press Start 2P', monospace; }
			.victory-text { display: block; text-align: center; max-width: 28rem; line-height: 2; padding: 0 var(--wa-space-m); }
			
			.rewards-container {
				display: flex; gap: 2rem; margin: 2rem 0; flex-wrap: wrap; justify-content: center;
			}
			.reward-item {
				display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
			}
			.reward-img {
				width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
			}
			.reward-name {
				font-size: 0.8rem; color: #fbbf24;
			}

			.ng-btn {
				margin-top: var(--wa-space-xl); 
				--border-radius: 0;
				font-family: var(--wa-font-family-body);
				animation: bounce 1s infinite;
			}

			@keyframes pulse { 50% { opacity: .5; } }
			@keyframes bounce {
				0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
				50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
			}
			@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		`
	];
}

customElements.define('victory-screen', VictoryScreen);
