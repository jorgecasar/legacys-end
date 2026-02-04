import { consume } from "@lit/context";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { html, LitElement, nothing } from "lit";
import { questHubStyles } from "./QuestHub.styles.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "../about-slides/about-slides.js";
import "../language-selector/language-selector.js";
import "./components/quest-card/quest-card.js";
import { loggerContext } from "../../contexts/logger-context.js";
import { UIEvents } from "../../core/events.js";

/**
 * QuestHub - Quest selection UI
 *
 * @typedef {import("../about-slides/AboutSlides.js").AboutSlides} AboutSlides
 * @typedef {import("../../content/quests/quest-types.js").Quest} Quest
 * @typedef {import("../../services/interfaces.js").ILoggerService} ILoggerService
 *
 * Displays available quests with:
 * - Quest cards for each available quest
 * - Coming soon section
 * - About dialog
 * - Fullscreen toggle
 * - Progress reset
 *
 * @element quest-hub
 * @property {Array<Quest>} quests - Available quests
 * @property {Array<Quest>} comingSoonQuests - Coming soon quests
 * @property {boolean} showFullDescription - Whether to show full description
 * @property {boolean} isFullscreen - Whether the app is in fullscreen mode
 * @fires quest-select - Fired when a quest is selected
 * @fires quest-continue - Fired when a quest is continued
 * @fires reset-progress - Fired when progress reset is requested
 */
export class QuestHub extends LitElement {
	/** @override */
	static styles = questHubStyles;

	/** @override */
	static properties = {
		quests: { type: Array },
		comingSoonQuests: { type: Array },
		showFullDescription: { type: Boolean },
		isFullscreen: { type: Boolean },
		localizationService: { attribute: false },
	};

	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
		/** @type {unknown} */ (null)
	);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		/** @type {Quest[]} */
		this.quests = [];
		/** @type {Quest[]} */
		this.comingSoonQuests = [];
		this.showFullDescription = false;
		this.isFullscreen = !!document.fullscreenElement;
		/** @type {import('../../services/localization-service.js').LocalizationService | null} */
		this.localizationService = null;
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
		document.addEventListener(
			"fullscreenchange",
			this.handleFullscreenChange.bind(this),
		);
	}

	/** @override */
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

	/** @override */
	/** @override */
	render() {
		return html`
			<div class="hub-container">
				<header class="hub-header">
					<nav class="hub-navbar">
						<div class="navbar-actions">
						<wa-button variant="brand" @click="${this.#dispatchOpenAbout}">
						<wa-icon slot="start" name="user"></wa-icon>
						${msg("About")}
						</wa-button>
						<wa-button @click="${this.#toggleFullscreen}">
						<wa-icon slot="start" name="${this.isFullscreen ? "compress" : "expand"}"></wa-icon>
						${this.isFullscreen ? msg("Exit Fullscreen") : msg("Fullscreen")}
						</wa-button>
						<language-selector
							.localizationService="${this.localizationService}"
						></language-selector>
						</div>
					</nav>

					<div class="header-content">
						<h1 class="hub-title">${msg("LEGACY'S END")}</h1>
						<p class="hub-subtitle">${msg("Tired of legacy code? It's time for transformation!")}</p>
						
						<div class="hub-description">
							<p>${msg("LEGACY'S END is your epic journey to master clean, portable, and maintainable frontend architecture. Join Alarion, the code acolyte, as he unlocks powerful architectural skills to turn chaos into mastery.")}</p>
							
							${
								this.showFullDescription
									? html`
								<p>${msg("Each chapter is an interactive mission where you'll refactor real code, learning to:")}</p>
								<div class="learning-objectives">
									<wa-card appearance="filled">
										<div slot="header">${msg("🛡️ Encapsulate Code")}</div>
										${msg("Master Web Components and Shadow DOM to build truly autonomous UI elements.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🎨 Themeable UI")}</div>
										${msg("Architect flexible design systems using CSS Tokens that adapt to any brand.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🌐 Decouple Services")}</div>
										${msg("Isolate business logic from infrastructure to enable seamless backend swaps.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("❤️ Reactive State")}</div>
										${msg("Control data flow with modern signals and observers for predictable updates.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🔒 Robust Security")}</div>
										${msg("Centralize authentication and authorization to keep your application resilient.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("✅ Ultimate Testing")}</div>
										${msg("Implement anti-regression shields with unit, integration, and E2E tests.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🧩 Scalable Patterns")}</div>
										${msg("Master Dependency Injection and Command patterns for enterprise-grade code.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("📝 Self-Documentation")}</div>
										${msg("Leverage JSDoc and standard conventions to keep your codebase readable.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🏎️ High Performance")}</div>
										${msg("Minimize rendering cycles and optimize bundles for a lightning-fast experience.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("🤖 Built-in AI")}</div>
										${msg("Leverage the power of the browser's 1st-class AI APIs for natural interaction.")}
									</wa-card>
									<wa-card appearance="filled">
										<div slot="header">${msg("♿ Accessibility")}</div>
										${msg("Master ARIA and focus management to build inclusive experiences for all.")}
									</wa-card>
								</div>
							`
									: html`
								<wa-button @click="${this.#toggleDescription}" variant="neutral">
									${msg("Read More")}
								</wa-button>
							`
							}
						</div>
					</div>
				</header>

				<section class="quests-section">
					<h2 class="section-title">${msg("Choose your next adventure...")}</h2>
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
						<h2 class="section-title">${msg("Coming Soon")}</h2>
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
						${msg("Reset Progress")}
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
				msg(
					"Are you sure you want to reset all progress? This cannot be undone.",
				),
			)
		) {
			this.dispatchEvent(
				new CustomEvent(UIEvents.RESET_PROGRESS, {
					bubbles: true,
					composed: true,
				}),
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
		if (document.fullscreenElement) {
			document.exitFullscreen();
			this.logger.info("Fullscreen disabled");
			return;
		}
		document.documentElement
			.requestFullscreen({ navigationUI: "show" })
			.then(() => {
				this.logger.info("Fullscreen enabled");
			})
			.catch((err) => {
				this.logger.error(`Error enabling fullscreen: ${err.message}`);
			});
	}
}
