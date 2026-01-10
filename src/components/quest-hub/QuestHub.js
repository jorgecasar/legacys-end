import { html, LitElement, nothing } from "lit";
import { questHubStyles } from "./QuestHub.styles.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "../about-slides/about-slides.js";
import "./components/quest-card/quest-card.js";

/**
 * QuestHub - Quest selection UI
 *
 * @typedef {import("../about-slides/AboutSlides.js").AboutSlides} AboutSlides
 * @typedef {import("../../content/quests/quest-types.js").Quest} Quest
 * @typedef {import("../../content/quests/quest-types.js").EnrichedQuest} EnrichedQuest
 *
 * Displays available quests with:
 * - Quest cards for each available quest
 * - Coming soon section
 * - About dialog
 * - Fullscreen toggle
 * - Progress reset
 *
 * @element quest-hub
 * @property {Array<EnrichedQuest>} quests - Available quests
 * @property {Array<EnrichedQuest>} comingSoonQuests - Coming soon quests
 * @property {boolean} showFullDescription - Whether to show full description
 * @property {boolean} isFullscreen - Whether the app is in fullscreen mode
 * @fires quest-select - Fired when a quest is selected
 * @fires quest-continue - Fired when a quest is continued
 * @fires reset-progress - Fired when progress reset is requested
 */
export class QuestHub extends LitElement {
	static styles = questHubStyles;

	static properties = {
		quests: { type: Array },
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

	/**
	 * Handles fullscreen change events
	 */
	handleFullscreenChange() {
		this.isFullscreen = !!document.fullscreenElement;
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
						<wa-button variant="brand" @click="${this.#dispatchOpenAbout}">
							<wa-icon slot="start" name="user"></wa-icon> About
						</wa-button>
						<wa-button @click="${this.#toggleFullscreen}">
							<wa-icon name="${this.isFullscreen ? "compress" : "expand"}"></wa-icon>
							<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap;">Toggle Fullscreen</span>
						</wa-button>
					</div>
				</header>

				<section class="quests-section">
					<h2 class="section-title">Choose your next adventure...</h2>
					<div class="wa-grid">
						${this.quests.map(
							(quest) => html`
							<quest-card .quest=${quest}></quest-card>
						`,
						)}
					</div>
				</section>

				${
					this.comingSoonQuests.length > 0
						? html`<section class="coming-soon-section">
						<h2 class="section-title">Coming Soon</h2>
						<div class="wa-grid">
							${this.comingSoonQuests.map(
								(quest) => html`
								<quest-card .quest=${quest} .isComingSoon=${true}></quest-card>
							`,
							)}
						</div>
					</section>`
						: nothing
				}

				<footer class="hub-footer">
					<wa-button variant="danger" @click="${this.#dispatchReset}">
						<wa-icon slot="start" name="trash"></wa-icon> Reset Progress
					</wa-button>
				</footer>
				
				<about-slides></about-slides>
			</div>
		`;
	}

	/**
	 * Dispatches reset progress event after confirmation
	 */
	#dispatchReset() {
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

	/**
	 * Opens the about dialog
	 */
	#dispatchOpenAbout() {
		const aboutSlides = /** @type {AboutSlides} */ (
			this.shadowRoot?.querySelector("about-slides")
		);
		aboutSlides.show();
	}

	/**
	 * Toggles fullscreen mode
	 */
	#toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}
}
