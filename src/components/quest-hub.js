import { LitElement, html, css, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import { sharedStyles } from '../styles/shared.js';

/**
 * QuestHub - Quest selection UI
 * 
 * Displays available quests with:
 * - Progress indicators
 * - Lock status
 * - Badges for completed quests
 * - Continue button for in-progress quests
 */
export class QuestHub extends LitElement {
	static properties = {
		availableQuests: { type: Array },
		comingSoonQuests: { type: Array },
		completedQuests: { type: Array },
		currentQuestId: { type: String },
		onQuestSelect: { type: Function },
		onContinueQuest: { type: Function },
		getQuestProgress: { type: Function },
		isQuestCompleted: { type: Function },
		isQuestLocked: { type: Function },
		isQuestLocked: { type: Function },
		showFullDescription: { type: Boolean },
		isFullscreen: { type: Boolean }
	};

	constructor() {
		super();
		this.availableQuests = [];
		this.comingSoonQuests = [];
		this.completedQuests = [];
		this.currentQuestId = null;
		this.onQuestSelect = () => { };
		this.onContinueQuest = () => { };
		this.getQuestProgress = () => 0;
		this.isQuestCompleted = () => false;
		this.isQuestLocked = () => false;
		this.isQuestLocked = () => false;
		this.showFullDescription = false; // Initialize to false
		this.isFullscreen = false;
	}

	connectedCallback() {
		super.connectedCallback();
		document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
	}

	handleFullscreenChange() {
		this.isFullscreen = !!document.fullscreenElement;
	}

	getQuestVariant(quest) {
		if (this.isQuestCompleted(quest.id)) return 'success';
		if (this.isQuestLocked(quest.id)) return 'neutral';
		return 'brand';
	}

	getDifficultyVariant(difficulty) {
		switch (difficulty.toLowerCase()) {
			case 'beginner': return 'success';
			case 'intermediate': return 'warning';
			case 'advanced': return 'danger';
			default: return 'neutral';
		}
	}

	renderQuestCard(quest, isComingSoon = false) {
		const progress = this.getQuestProgress(quest.id);
		const completed = this.isQuestCompleted(quest.id);
		const locked = this.isQuestLocked(quest.id) || isComingSoon;
		const isCurrent = quest.id === this.currentQuestId;
		const variant = this.getQuestVariant(quest);

		return html`
			<wa-card
				class="quest-card ${locked ? 'locked' : ''} ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''} variant-${variant}"
				appearance="${completed ? 'filled' : 'outlined'}"
			>
				<h5 slot="header" class="quest-header">${quest.name}</h5>
				<wa-icon slot="header-actions" name="${quest.icon || 'box'}"></wa-icon>

				<div class="quest-content">
					${quest.subtitle ? html`
						<h6 class="quest-subtitle">${quest.subtitle}</h6>
					` : ''}
					
					<p class="quest-description">${quest.description}</p>
					
					${!locked ? html`
						<div style="display: flex; justify-content: space-between; font-size: var(--wa-font-size-2xs); margin-bottom: var(--wa-space-3xs);">
							<span>Progress</span>
							<span>${Math.round(progress)}%</span>
						</div>
						<wa-progress-bar value="${progress}" style="--height: 6px;"></wa-progress-bar>
					` : ''}
				</div>
				<div slot="footer" class="wa-stack wa-gap-0">
					<span class="quest-time">
						<wa-icon name="clock"></wa-icon> ${quest.estimatedTime}
					</span>
					<wa-badge variant="${this.getDifficultyVariant(quest.difficulty)}">
						${quest.difficulty}
					</wa-badge>
				</div>

				
				${locked ? html`
					<wa-button slot="footer-actions" variant="neutral" disabled>
						<wa-icon slot="start" name="lock"></wa-icon> Locked
					</wa-button>
				` : nothing}

				${!locked && completed ? html`
					<wa-button slot="footer-actions" variant="success" @click="${() => this.onQuestSelect(quest.id)}">
						<wa-icon slot="start" name="rotate-right"></wa-icon> Restart
					</wa-button>
				` : ''}

				${!locked && !completed ? html`
						<wa-button slot="footer-actions" variant="brand" @click="${() => progress > 0 ? this.onContinueQuest(quest.id) : this.onQuestSelect(quest.id)}">
							<wa-icon slot="start" name="play"></wa-icon> ${progress > 0 ? 'Continue' : 'Start'}
						</wa-button>
				` : ''}
			</wa-card>
		`;
	}

	render() {
		return html`
			<div class="hub-container">
				<header class="hub-header">
					<h1 class="hub-title">LEGACY'S END</h1>
					<p class="hub-subtitle">Tired of legacy code? It's time for transformation!</p>
					<div class="hub-description">
						<p>LEGACY'S END is your epic journey to master clean, portable, and maintainable frontend architecture. Join Alarion, the code acolyte, as he unlocks powerful architectural skills to turn chaos into mastery.</p>
						<div ?hidden="${!this.showFullDescription}">
							<p>Each chapter is an interactive mission where you'll refactor real code, learning to:</p>
							<ul class="hub-description-list">
								<li>🛡️ Encapsulate Your Code: Create autonomous components.</li>
								<li>🎨 Dress Your App: Adapt your UI to any brand or theme.</li>
								<li>🌐 Decouple Services: Connect your logic to any backend.</li>
								<li>❤️ Manage State: Control the flow of reactive data.</li>
								<li>🔒 Centralize Security: Protect your routes and users.</li>
								<li>✅ Test Your Code: Build ultimate anti-regression shields.</li>
								<li>🔥 Handle Errors: Transform chaos into intelligence.</li>
								<li>🌍 Globalize Your App: Reach every language and market.</li>
							</ul>
							<p>Forge a code legacy that endures.</p>
							<p style="font-weight: bold;">Start your adventure today and become a Master of Clean Code!</p>
						</div>
						<wa-button @click="${() => this.showFullDescription = !this.showFullDescription}">
							${this.showFullDescription ? 'Read Less' : 'Read More'}
						</wa-button>
						<wa-button variant="brand" @click="${this.dispatchOpenAbout}">
							<wa-icon slot="start" name="user"></wa-icon> About
						</wa-button>
						<wa-button @click="${this.toggleFullscreen}">
							<wa-icon name="${this.isFullscreen ? 'compress' : 'expand'}"></wa-icon>
						</wa-button>
					</div>
				</header>

				<section class="quests-section">
					<h2 class="section-title">Choose your next adventure...</h2>
					<div class="wa-grid">
						${this.availableQuests.map(quest => this.renderQuestCard(quest))}
					</div>
				</section>

				${this.comingSoonQuests.length > 0 ?
				html`<section class="coming-soon-section">
					<h2 class="section-title">Coming Soon</h2>
					<div class="wa-grid">
						${this.comingSoonQuests.map(quest => this.renderQuestCard(quest, true))}
					</div>
				</section>` :
				nothing}

				<footer class="hub-footer">
					<wa-button variant="danger" @click="${this.dispatchReset}">
						<wa-icon slot="start" name="trash"></wa-icon> Reset Progress
					</wa-button>
				</footer>
			</div>
		`;
	}

	dispatchReset() {
		if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
			this.dispatchEvent(new CustomEvent('reset-progress', { bubbles: true, composed: true }));
		}
	}

	dispatchOpenAbout() {
		this.dispatchEvent(new CustomEvent('open-about', { bubbles: true, composed: true }));
	}

	toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}

	static styles = [
		...sharedStyles,
		css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			overflow-y: auto;
			background-color: var(--wa-color-surface-default);
			color: var(--wa-color-text-normal);
			--wa-font-sans: 'Press Start 2P', monospace;
		}

		.hub-container {
			max-width: 1400px;
			margin: 0 auto;
			padding: var(--wa-space-xl);
		}

		.hub-header {
			text-align: center;
			margin-bottom: var(--wa-space-xl);
		}

		.hub-title {
			font-size: var(--wa-font-size-3xl);
			margin: 0 0 var(--wa-space-xs) 0;
			font-family: var(--wa-font-family-heading);
			text-shadow: var(--wa-shadow-small);
			color: var(--wa-color-warning-fill-loud);
		}

		.hub-subtitle {
			font-size: var(--wa-font-size-l);
			margin: 0;
			opacity: 0.9;
		}

		.top-actions {
			position: absolute;
			top: var(--wa-space-m);
			right: var(--wa-space-m);
			z-index: 10;
			display: flex;
			gap: var(--wa-space-s);
		}

		.action-button {
			/* No extra styles needed */
		}

		.hub-sub-text {
			font-size: var(--wa-font-size-s);
			margin-top: var(--wa-space-xs);
			opacity: 0.7;
		}

		.section-title {
			font-size: var(--wa-font-size-xl);
			margin: var(--wa-space-xl) 0 var(--wa-space-m) 0;
			font-family: var(--wa-font-family-body);
			color: var(--wa-color-warning-fill-loud);
		}

		wa-card h5 {
			margin-block-end: 0;
		}
		
		.quest-card::part(body) {
			display: flex;
			flex-direction: column;
			height: 100%;
			gap: var(--wa-space-xs);
		}

		.quest-card:not(.locked):not(.coming-soon):hover {
			/* No hover effect */
		}

		.quest-card.locked {
			cursor: not-allowed;
			opacity: 0.6;
		}

		/* Variants */
		.quest-card.variant-brand {
			--wa-card-border-color: var(--wa-color-brand-600);
			--wa-card-border-top-width: 4px;
		}
		
		.quest-card.variant-success {
			--wa-card-border-color: #10b981;
			--wa-card-border-top-width: 4px;
		}
		
		.quest-card.variant-neutral {
			--wa-card-border-color: #6b7280;
		}

		.quest-card.completed {
			--wa-card-border-color: #10b981;
		}

		.quest-content {
			display: flex;
			flex-direction: column;
			flex: 1;
			gap: var(--wa-space-s);
		}

		.quest-description {
			flex: 1;
		}

		.quest-subtitle {
			font-style: italic;
			color: var(--wa-color-text-quiet);
			margin: 0;
		}

		.quest-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: var(--wa-font-size-2xs);
		}

		.quest-time {
			opacity: 0.8;
			display: flex;
			align-items: center;
			gap: var(--wa-space-2xs);
		}


		.prerequisites {
			font-size: var(--wa-font-size-2xs);
			opacity: 0.8;
			margin: 0;
			color: var(--wa-color-neutral-40);
			text-align: center;
		}

		.coming-soon-section {
			opacity: 0.7;
		}

		.hub-description {
			margin: 1.5rem auto 0 auto;
			font-size: var(--wa-font-size-s);
			line-height: 1.6;
			color: var(--wa-color-text-quiet);
			text-align: left;
		}

		.hub-footer {
			margin-top: var(--wa-space-4xl);
			text-align: center;
		}
	`];
}

customElements.define('quest-hub', QuestHub);
