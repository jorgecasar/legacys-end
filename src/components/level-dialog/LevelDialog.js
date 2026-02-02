import { consume } from "@lit/context";
import { msg, str, updateWhenLocaleChanges } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "syntax-highlight-element";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { UIEvents } from "../../core/events.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { escapeHtml } from "../../utils/html-utils.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import { levelDialogStyles } from "./LevelDialog.styles.js";

/**
 * @typedef {import('../../content/quests/quest-types.js').LevelConfig} LevelConfig
 * @typedef {import('../../content/quests/quest-types.js').CodeSnippet} CodeSnippet
 */

/**
 * LevelDialog - Interactive dialog for level completion
 *
 * Displays level information in a slide-based format with:
 * - Narrative descriptions
 * - Code snippets (before/after)
 * - Problem descriptions
 * - Architectural analysis
 * - Completion confirmation with rewards
 *
 * @element level-dialog
 * @property {LevelConfig} config - Level configuration data
 * @property {string} level - Level identifier
 * @fires complete - Fired when user completes the dialog
 * @fires close - Fired when dialog is closed
 */
export class LevelDialog extends SignalWatcher(LitElement) {
	/** @type {import('../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../game/interfaces.js').IQuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IWorldStateService} */
	@consume({ context: worldStateContext, subscribe: true })
	accessor worldState =
		/** @type {import('../../game/interfaces.js').IWorldStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @override */
	static styles = levelDialogStyles;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
		window.addEventListener("keydown", this.#handleKeyDown);
	}

	/** @override */
	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener("keydown", this.#handleKeyDown);
	}

	/**
	 * Updates the component when properties change
	 * @param {import("lit").PropertyValues<this>} changedProperties - The properties that have changed
	 * @override
	 */
	updated(changedProperties) {
		super.updated(changedProperties);

		if (!this.worldState) return;

		const slideIndex = this.worldState.currentSlideIndex.get();
		const slides = this.#getSlides();

		// Always update text when rendering
		this.dispatchEvent(
			new CustomEvent(UIEvents.SLIDE_CHANGED, {
				detail: {
					text: this.#getCurrentSlideText(),
					nextText: this.#getNextSlideText(),
				},
				bubbles: true,
				composed: true,
			}),
		);

		if (slides[slideIndex] === "confirmation") {
			this.updateComplete.then(() => {
				requestAnimationFrame(() => {
					const btn = /** @type {HTMLElement} */ (
						this.shadowRoot?.querySelector(".complete-btn")
					);
					if (btn) btn.focus();
				});
			});
		}
	}

	/**
	 * Handles keydown events for navigation
	 * @param {KeyboardEvent} e - The keydown event
	 */
	#handleKeyDown = (e) => {
		if (e.key === "ArrowRight" || e.code === "Space") {
			e.stopPropagation();
			this.nextSlide();
		}

		if (e.key === "ArrowLeft") {
			e.stopPropagation();
			this.prevSlide();
		}
	};

	/**
	 * Advances to the next slide or completes the dialog
	 */
	nextSlide() {
		if (!this.worldState) return;
		const slides = this.#getSlides();
		const currentIndex = this.worldState.currentSlideIndex.get();

		if (currentIndex < slides.length - 1) {
			this.worldState.nextSlide();
		} else {
			this.#dispatchComplete();
		}
	}

	/**
	 * Goes back to the previous slide
	 */
	prevSlide() {
		this.worldState?.prevSlide();
	}

	/**
	 * Gets the text content of the next slide for prefetching
	 * @returns {string} The next slide text
	 */
	#getNextSlideText() {
		if (!this.worldState) return "";
		const currentIndex = this.worldState.currentSlideIndex.get();
		const nextIndex = currentIndex + 1;
		const slides = this.#getSlides();

		if (nextIndex >= slides.length) return "";
		return this.#getSlideText(nextIndex);
	}

	/**
	 * Gets the text content of the current slide for accessibility
	 * @returns {string} The slide text
	 */
	#getCurrentSlideText() {
		if (!this.worldState) return "";
		return this.#getSlideText(this.worldState.currentSlideIndex.get());
	}

	/**
	 * Gets text for a specific slide index
	 * @param {number} index
	 * @returns {string}
	 */
	#getSlideText(index) {
		const slides = this.#getSlides();
		const type = slides[index];

		const config = this.questController?.currentChapter;
		if (!config) return "";

		switch (type) {
			case "narrative":
				return config.description || "";
			case "problem":
				return (config.problemDesc?.toString() || "").replace(/<[^>]*>/g, ""); // Basic tag cleanup
			case "code-start":
				return (
					config.codeSnippets?.start?.map((s) => `${s.title}.`).join(" ") || ""
				);
			case "code-end":
				return (
					config.codeSnippets?.end?.map((s) => `${s.title}.`).join(" ") || ""
				);
			case "analysis":
				return (
					msg("Key architectural changes: ") +
					(config.architecturalChanges?.join(". ") || "")
				);
			case "confirmation": {
				const levelCompleteText = msg("Level Complete!");
				const rewardText = config.reward?.name
					? msg(str`You have obtained ${config.reward.name}.`)
					: "";
				return `${levelCompleteText} ${rewardText}`.trim();
			}
			default:
				return "";
		}
	}

	/**
	 * Builds the sequence of slides based on available config data
	 * @returns {string[]} Array of slide type identifiers
	 */
	#getSlides() {
		const config = this.questController?.currentChapter;
		if (!config) return ["confirmation"];

		const sequence = [];
		if (config.description) {
			sequence.push("narrative");
		}
		if (config.codeSnippets?.start) {
			sequence.push("code-start");
		}
		if (config.problemDesc) {
			sequence.push("problem");
		}
		if (config.codeSnippets?.end) {
			sequence.push("code-end");
		}
		if (config.architecturalChanges && config.architecturalChanges.length > 0) {
			sequence.push("analysis");
		}
		sequence.push("confirmation");
		return sequence;
	}

	/**
	 * Dispatches completion event
	 */
	#dispatchComplete() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.COMPLETE, { bubbles: true, composed: true }),
		);
	}

	/**
	 * Dispatches close event
	 */
	#dispatchClose() {
		this.dispatchEvent(
			new CustomEvent(UIEvents.CLOSE, { bubbles: true, composed: true }),
		);
	}

	/**
	 * Renders a code snippet with syntax highlighting
	 * @param {CodeSnippet} snippet - The code snippet to render
	 * @param {string} type - The type of the code snippet
	 * @returns {import("lit").TemplateResult} The rendered code snippet
	 */
	#renderCode(
		{ title = msg("Identified Problem"), code, language = "js" },
		type,
	) {
		return html`
			<h6 class="slide-title ${type}">${title}</h6>
			<!-- @ts-ignore -->
			<syntax-highlight language="${language}" class="${type}" .innerHTML=${escapeHtml(code)}></syntax-highlight>
		`;
	}

	/**
	 * Renders code snippets slide
	 * @param {'start' | 'end'} type - The type of code slide
	 * @returns {import("lit").TemplateResult|Iterable<import("lit").TemplateResult>} The rendered slide
	 */
	#renderCodeSlide(type) {
		const config = this.questController?.currentChapter;
		const snippets =
			type === "start"
				? config?.codeSnippets?.start
				: config?.codeSnippets?.end;
		return (snippets || []).map((/** @type {CodeSnippet} */ snippet) =>
			this.#renderCode(snippet, `code-${type}`),
		);
	}

	/**
	 * Renders narrative slide
	 * @returns {import("lit").TemplateResult} The rendered slide
	 */
	#renderNarrativeSlide() {
		const config = this.questController?.currentChapter;
		return html`
			<div class="slide-content-centered">
				<div class="narrative-icon">
					<wa-icon name="scroll" class="narrative-icon-inner"></wa-icon>
				</div>
				${config?.description}
			</div>
		`;
	}

	/**
	 * Renders problem slide
	 * @returns {import("lit").TemplateResult} The rendered slide
	 */
	#renderProblemSlide() {
		const config = this.questController?.currentChapter;
		return html`
			<div class="slide-content-centered">
				<div class="narrative-icon problem-icon">
					<wa-icon name="triangle-exclamation" class="problem-icon-inner"></wa-icon>
				</div>
				${config?.problemDesc}
			</div>
		`;
	}

	/**
	 * Renders analysis slide
	 * @returns {import("lit").TemplateResult} The rendered slide
	 */
	#renderAnalysisSlide() {
		const config = this.questController?.currentChapter;
		return html`
			<h6 class="slide-title-analysis">${msg("Key Architectural Changes")}</h6>
			<div class="analysis-list">
				${config?.architecturalChanges?.map(
					(change) => html`
						<div class="analysis-item">
							<wa-icon name="arrow-right" class="analysis-arrow"></wa-icon>
							<span>${change}</span>
						</div>
					`,
				)}
			</div>
		`;
	}

	/**
	 * Renders confirmation slide
	 * @returns {import("lit").TemplateResult} The rendered slide
	 */
	#renderConfirmationSlide() {
		const config = this.questController?.currentChapter;
		return html`
			<div class="slide-content-between">
				<div></div>
				<div class="quest-complete-container">
					<h2 class="quest-complete-title">${msg("Level Complete!")}</h2>
					${
						config?.reward
							? html`
							<div class="reward-preview">
								<img 
									src="${ifDefined(processImagePath(config.reward.image))}" 
									srcset="${ifDefined(processImageSrcset(config.reward.image))}"
									sizes="(max-width: 600px) 200px, 400px"
									alt="${config.reward.name}" 
									class="reward-img" 
								/>
								<div class="reward-info">
									<h6 class="reward-name">${config.reward.name}</h6>
									<p class="reward-desc">${msg("Acquired! This item has been added to your inventory.")}</p>
								</div>
							</div>
						`
							: nothing
					}
				</div>
				<div class="spacer-top"></div>
			</div>
		`;
	}

	/**
	 * Override this method in subclasses to add custom slide types
	 * @param {string} _type - The slide type
	 * @returns {import("lit").TemplateResult | null | typeof nothing} The rendered slide, nothing, or null if not handled
	 */
	renderCustomSlide(_type) {
		return null;
	}

	/**
	 * Slide renderers mapping
	 * @type {Record<string, () => import("lit").TemplateResult | Iterable<import("lit").TemplateResult>>}
	 */
	#SLIDE_RENDERERS = {
		"code-start": () => this.#renderCodeSlide("start"),
		"code-end": () => this.#renderCodeSlide("end"),
		problem: () => this.#renderProblemSlide(),
		narrative: () => this.#renderNarrativeSlide(),
		analysis: () => this.#renderAnalysisSlide(),
		confirmation: () => this.#renderConfirmationSlide(),
	};

	/**
	 * Renders the content of a slide
	 * @param {string} type - The type of the slide
	 * @returns {import("lit").TemplateResult|Iterable<import("lit").TemplateResult>|typeof nothing} The rendered slide content
	 */
	#renderSlideContent(type) {
		// Try custom slides first (for extensibility)
		const custom = this.renderCustomSlide(type);
		if (custom) return custom;

		// Fall back to built-in slides
		const renderer = this.#SLIDE_RENDERERS[type];
		return renderer ? renderer() : nothing;
	}

	/** @override */
	render() {
		if (!this.worldState) return nothing;

		const slides = this.#getSlides();
		const currentSlideIndex = this.worldState.currentSlideIndex.get();
		const currentSlideType = slides[currentSlideIndex];
		const config = this.questController?.currentChapter;

		if (!currentSlideType) return nothing;

		return html`
			<wa-dialog 
				.label="${config?.title || ""}" 
				open
				@wa-request-close="${(/** @type {Event} */ e) => e.preventDefault()}"
				@wa-after-hide="${this.#dispatchClose}"
			>
				<div class="dialog-content">
					<!-- Content -->
					<div class="content-container wa-stack wa-gap-xs">
						${this.#renderSlideContent(currentSlideType)}
					</div>
				</div>

				<!-- Footer -->
				<div slot="footer" class="dialog-footer">
					<wa-button 
						.variant="${"neutral"}"
						?disabled="${currentSlideIndex === 0}"
						@click="${() => this.worldState?.prevSlide()}"
					>
						<wa-icon slot="start" name="arrow-left"></wa-icon> ${msg("PREV")}
					</wa-button>
					
					<!-- Indicators -->
					<div class="indicators">
						${slides.map(
							(_, i) => html`
								<div class="indicator ${i === currentSlideIndex ? "active" : "inactive"}"></div>
							`,
						)}
					</div>
					
					${
						currentSlideIndex === slides.length - 1
							? html`
							<wa-button 
								id="evolve-btn"
								.variant="${"brand"}"
								class="complete-btn"
								@click="${this.#dispatchComplete}"
								style="--border-radius: 0; animation: bounce 1s infinite;"
							>
								<span>${msg("EVOLVE")} <wa-icon slot="end" name="arrow-right"></wa-icon></span>
							</wa-button>
						`
							: html`
							<wa-button 
								id="next-btn"
								.variant="${"brand"}"
								@click="${() => this.worldState?.nextSlide()}"
							>
								<span>${msg("NEXT")} <wa-icon slot="end" name="arrow-right"></wa-icon></span>
							</wa-button>
						`
					}
				</div>
			</wa-dialog>
		`;
	}
}
