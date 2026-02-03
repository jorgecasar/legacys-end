import { consume } from "@lit/context";
import { updateWhenLocaleChanges } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { UIEvents } from "../../core/events.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { levelDialogStyles } from "./LevelDialog.styles.js";
import { getSlides, getSlideText } from "./utils/slide-utils.js";

import "./slides/analysis/level-dialog-slide-analysis.js";
import "./slides/code/level-dialog-slide-code.js";
import "./slides/confirmation/level-dialog-slide-confirmation.js";
import "./slides/narrative/level-dialog-slide-narrative.js";
import "./slides/problem/level-dialog-slide-problem.js";
import "./components/LevelDialogFooter.js";

/** @typedef {import('../../content/quests/quest-types.js').LevelConfig} LevelConfig */

/**
 * LevelDialog - Interactive dialog for level completion
 *
 * @element level-dialog
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
	 * @param {import('lit').PropertyValues<this>} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		super.updated(changedProperties);

		if (!this.worldState || !this.questController) return;

		const slideIndex = this.worldState.currentSlideIndex.get();
		const config = this.questController.currentChapter;
		if (!config) return;

		const slides = getSlides(config);

		// Always update text when rendering
		this.dispatchEvent(
			new CustomEvent(UIEvents.SLIDE_CHANGED, {
				detail: {
					text: getSlideText(slides[slideIndex] || "", config),
					nextText: getSlideText(slides[slideIndex + 1] || "", config),
				},
				bubbles: true,
				composed: true,
			}),
		);

		if (slides[slideIndex] === "confirmation") {
			this.updateComplete.then(() => {
				requestAnimationFrame(() => {
					const btn = /** @type {HTMLElement} */ (
						this.shadowRoot
							?.querySelector("level-dialog-footer")
							?.shadowRoot?.querySelector(".complete-btn")
					);
					if (btn) btn.focus();
				});
			});
		}
	}

	/**
	 * @param {KeyboardEvent} e
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
		if (!this.worldState || !this.questController) return;
		const config = this.questController.currentChapter;
		if (!config) return;

		const slides = getSlides(config);
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
	 * @param {string} _type
	 */
	renderCustomSlide(_type) {
		return null;
	}

	/**
	 * @type {Record<string, (config: LevelConfig) => import("lit").TemplateResult | Iterable<import("lit").TemplateResult>>}
	 */
	#SLIDE_RENDERERS = {
		"code-start": (config) =>
			html`<level-dialog-slide-code .snippets="${config.codeSnippets?.start || []}" type="start"></level-dialog-slide-code>`,
		"code-end": (config) =>
			html`<level-dialog-slide-code .snippets="${config.codeSnippets?.end || []}" type="end"></level-dialog-slide-code>`,
		problem: (config) =>
			html`<level-dialog-slide-problem .problemDesc="${config.problemDesc}"></level-dialog-slide-problem>`,
		narrative: (config) =>
			html`<level-dialog-slide-narrative .description="${config.description || ""}"></level-dialog-slide-narrative>`,
		analysis: (config) =>
			html`<level-dialog-slide-analysis .architecturalChanges="${config.architecturalChanges || []}"></level-dialog-slide-analysis>`,
		confirmation: (config) =>
			html`<level-dialog-slide-confirmation .reward="${config.reward}"></level-dialog-slide-confirmation>`,
	};

	/**
	 * @param {string} type
	 */
	#renderSlideContent(type) {
		const custom = this.renderCustomSlide(type);
		if (custom) return custom;

		const renderer =
			/** @type {((config: LevelConfig) => import("lit").TemplateResult) | undefined} */ (
				this.#SLIDE_RENDERERS[type]
			);
		const config = this.questController?.currentChapter;
		return renderer && config ? renderer(config) : nothing;
	}

	/** @override */
	render() {
		if (!this.worldState || !this.questController) return nothing;

		const config = this.questController.currentChapter;
		if (!config) return nothing;

		const slides = getSlides(config);
		const currentSlideIndex = this.worldState.currentSlideIndex.get();
		const currentSlideType = slides[currentSlideIndex];

		if (!currentSlideType) return nothing;

		return html`
			<wa-dialog 
				.label="${config.title || ""}" 
				open
				@wa-request-close="${(/** @type {Event} */ e) => e.preventDefault()}"
				@wa-after-hide="${this.#dispatchClose}"
			>
				<div class="dialog-content">
					<div class="content-container wa-stack wa-gap-xs">
						${this.#renderSlideContent(currentSlideType)}
					</div>
				</div>

				<level-dialog-footer 
					slot="footer"
					.slides="${slides}"
					.currentSlideIndex="${currentSlideIndex}"
					@prev="${() => this.prevSlide()}"
					@next="${() => this.nextSlide()}"
					@complete="${() => this.#dispatchComplete()}"
				></level-dialog-footer>
			</wa-dialog>
		`;
	}
}
