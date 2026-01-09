import { html, LitElement, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { questHubStyles } from "./QuestHub.styles.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "../about-slides/about-slides.js";

/**
 * QuestHub - Quest selection UI
 *
 * @typedef {import("../about-slides/AboutSlides.js").AboutSlides} AboutSlides
 * @typedef {import("../../content/quests/quest-types.js").Quest} Quest
 * @typedef {import("../../content/quests/quest-types.js").EnrichedQuest} EnrichedQuest
 *
 * Displays available quests with:
 * - Progress indicators
 * - Lock status
 * - Badges for completed quests
 * - Continue button for in-progress quests
 *
 * @element quest-hub
 * @property {Array<EnrichedQuest>} quests
 * @property {Array<EnrichedQuest>} comingSoonQuests
 * @property {Boolean} showFullDescription
 * @property {Boolean} isFullscreen
 */
export class QuestHub extends LitElement {
	static styles = questHubStyles;

	static properties = {
		quests: { type: Array }, // Enriched quest data with progress, locks, etc.
		comingSoonQuests: { type: Array },
		showFullDescription: { type: Boolean },
		isFullscreen: { type: Boolean },
	};

	constructor() {
		super();
		/** @type {EnrichedQuest[]} */
		this.quests = [];
		/** @type {EnrichedQuest[]} */
		this.comingSoonQuests = [];
		this.showFullDescription = false;
		this.isFullscreen = false;
	}

	connectedCallback() {
		super.connectedCallback();
		document.addEventListener(
			"fullscreenchange",
			this.handleFullscreenChange.bind(this),
		);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener(
			"fullscreenchange",
			this.handleFullscreenChange.bind(this),
		);
	}

	handleFullscreenChange() {
		this.isFullscreen = !!document.fullscreenElement;
	}

	/**
	 * @param {EnrichedQuest} quest
	 */
	getQuestVariant(quest) {
		if (quest.isCompleted) return "success";
		if (quest.isLocked) return "neutral";
		return "brand";
	}

	/**
	 * @param {string} difficulty
	 */
	getDifficultyVariant(difficulty) {
		switch (difficulty.toLowerCase()) {
			case "beginner":
				return "success";
			case "intermediate":
				return "warning";
			case "advanced":
				return "danger";
			default:
				return "neutral";
		}
	}

	/**
	 * @param {EnrichedQuest} quest
	 * @param {boolean} [isComingSoon]
	 */
	renderQuestCard(quest, isComingSoon = false) {
		const progress = quest.progress || 0;
		const completed = quest.isCompleted || false;
		const locked = quest.isLocked || isComingSoon;
		const isCurrent = quest.inProgress || false;
		const variant = this.getQuestVariant(quest);

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
				<h5 slot="header" class="quest-header">${quest.name}</h5>
				<wa-icon slot="header-actions" .name="${quest.icon || "box"}"></wa-icon>

				<div class="quest-content">
					${
						quest.subtitle
							? html`
						<h6 class="quest-subtitle">${quest.subtitle}</h6>
					`
							: ""
					}
					
					<p class="quest-description">${quest.description}</p>
					
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
						<wa-icon name="clock"></wa-icon> ${quest.estimatedTime}
					</span>
					<wa-badge .variant="${this.getDifficultyVariant(quest.difficulty || "beginner")}">
						${quest.difficulty}
					</wa-badge>
				</div>

				
				${
					locked
						? html`
					${
						isComingSoon
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
					<wa-button slot="footer-actions" .variant="${"success"}" @click="${() => this.dispatchEvent(new CustomEvent("quest-select", { detail: { questId: quest.id } }))}">
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
							@click="${() => {
								const eventName =
									progress > 0 ? "quest-continue" : "quest-select";
								this.dispatchEvent(
									new CustomEvent(eventName, { detail: { questId: quest.id } }),
								);
							}}"
						>
							<wa-icon slot="start" name="play"></wa-icon> ${progress > 0 ? "Continue" : "Start"}
						</wa-button>
				`
						: ""
				}
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
						<wa-button @click="${() => {
							this.showFullDescription = !this.showFullDescription;
						}}">
							${this.showFullDescription ? "Read Less" : "Read More"}
						</wa-button>
						<wa-button variant="brand" @click="${this.dispatchOpenAbout}">
							<wa-icon slot="start" name="user"></wa-icon> About
						</wa-button>
						<wa-button @click="${this.toggleFullscreen}">
							<wa-icon name="${this.isFullscreen ? "compress" : "expand"}"></wa-icon>
							<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap;">Toggle Fullscreen</span>
						</wa-button>
					</div>
				</header>

				<section class="quests-section">
					<h2 class="section-title">Choose your next adventure...</h2>
					<div class="wa-grid">
						${this.quests.map((quest) => this.renderQuestCard(quest))}
					</div>
				</section>

				${
					this.comingSoonQuests.length > 0
						? html`<section class="coming-soon-section">
					<h2 class="section-title">Coming Soon</h2>
					<div class="wa-grid">
						${this.comingSoonQuests.map((quest) => this.renderQuestCard(quest, true))}
					</div>
				</section>`
						: nothing
				}

				<footer class="hub-footer">
					<wa-button variant="danger" @click="${this.dispatchReset}">
						<wa-icon slot="start" name="trash"></wa-icon> Reset Progress
					</wa-button>
				</footer>
				
				<about-slides></about-slides>
			</div>
		`;
	}

	dispatchReset() {
		if (
			confirm(
				"Are you sure you want to reset all progress? This cannot be undone.",
			)
		) {
			this.dispatchEvent(
				new CustomEvent("reset-progress", { bubbles: true, composed: true }),
			);
		}
	}

	dispatchOpenAbout() {
		const aboutSlides = /** @type {AboutSlides} */ (
			this.shadowRoot?.querySelector("about-slides")
		);
		aboutSlides.show();
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
}
