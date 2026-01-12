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
		this.isFullscreen = !!document.fullscreenElement;
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

	/**
	 * Toggles the full description visibility
	 */
	#toggleDescription() {
		this.showFullDescription = !this.showFullDescription;
	}

	render() {
		return html`
			<div class="hub-container">
				<header class="hub-header">
					<nav class="hub-navbar">
						<div class="navbar-actions">
							<wa-button variant="brand" @click="${this.#dispatchOpenAbout}">
								<wa-icon slot="start" name="user"></wa-icon>
								About
							</wa-button>
							<wa-button @click="${this.#toggleFullscreen}">
								<wa-icon slot="start" name="${this.isFullscreen ? "compress" : "expand"}"></wa-icon>
								${this.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
							</wa-button>
						</div>
					</nav>

					<div class="header-content">
						<h1 class="hub-title">LEGACY'S END</h1>
						<p class="hub-subtitle">Tired of legacy code? It's time for transformation!</p>
						
						<div class="hub-description">
							<p>LEGACY'S END is your epic journey to master clean, portable, and maintainable frontend architecture. Join Alarion, the code acolyte, as he unlocks powerful architectural skills to turn chaos into mastery.</p>
							
							${
								this.showFullDescription
									? html`
								<p>Each chapter is an interactive mission where you'll refactor real code, learning to:</p>
								<ul class="learning-objectives">
									<li>🛡️ <strong>Encapsulate Your Code:</strong> Create autonomous components.</li>
									<li>🎨 <strong>Dress Your App:</strong> Adapt your UI to any brand or theme.</li>
									<li>🌐 <strong>Decouple Services:</strong> Connect your logic to any backend.</li>
									<li>❤️ <strong>Manage State:</strong> Control the flow of reactive data.</li>
									<li>🔒 <strong>Centralize Security:</strong> Protect your routes and users.</li>
									<li>✅ <strong>Test Your Code:</strong> Build ultimate anti-regression shields.</li>
								</ul>
							`
									: html`
								<wa-button @click="${this.#toggleDescription}" variant="neutral">
									Read More
								</wa-button>
							`
							}
						</div>
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
						<wa-icon slot="start" name="trash"></wa-icon>
						Reset Progress
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
