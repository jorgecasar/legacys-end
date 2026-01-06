import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { html, LitElement } from "lit";
import { map } from "lit/directives/map.js";
import "syntax-highlight-element";
import { processImagePath } from "../utils/process-assets.js";
import { styles } from "./level-dialog.css.js";

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} html - The HTML to escape
 * @returns {string} The escaped HTML
 */
function escapeHtml(html) {
	const placeholderElement = document.createElement("div");
	const textNode = document.createTextNode(html);
	placeholderElement.appendChild(textNode);
	return placeholderElement.innerHTML;
}

/**
 * @typedef {import('../content/quests/quest-types.js').LevelConfig} LevelConfig
 */

export class LevelDialog extends LitElement {
	static properties = {
		config: { type: Object },
		level: { type: String },
		slideIndex: { state: true },
	};

	constructor() {
		super();
		/** @type {LevelConfig} */
		this.config = /** @type {LevelConfig} */ ({});
		this.level = "";
		this.slideIndex = 0;
	}

	connectedCallback() {
		super.connectedCallback();
		window.addEventListener("keydown", this.handleKeyDown);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener("keydown", this.handleKeyDown);
	}

	/**
	 * Updates the component when properties change
	 * @param {Map<string, any>} changedProperties - The properties that have changed
	 */
	updated(changedProperties) {
		if (changedProperties.has("slideIndex")) {
			const slides = this.getSlides();
			if (slides[this.slideIndex] === "confirmation") {
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
	}

	/**
	 * Handles keydown events
	 * @param {KeyboardEvent} e - The keydown event
	 */
	handleKeyDown = (e) => {
		if (e.key === "ArrowRight" || e.code === "Space") {
			e.stopPropagation();
			this.nextSlide();
		}

		if (e.key === "ArrowLeft") {
			e.stopPropagation();
			this.prevSlide();
		}
	};

	nextSlide() {
		const slides = this.getSlides();
		if (this.slideIndex < slides.length - 1) {
			this.slideIndex++;
		} else {
			this.dispatchComplete();
		}
	}

	prevSlide() {
		this.slideIndex = Math.max(this.slideIndex - 1, 0);
	}

	getCurrentSlideText() {
		const slides = this.getSlides();
		const type = slides[this.slideIndex];

		switch (type) {
			case "narrative":
				return this.config.description || "";
			case "problem":
				return (this.config.problemDesc?.toString() || "").replace(
					/<[^>]*>/g,
					"",
				); // Basic tag cleanup
			case "code-start":
				return (
					this.config.codeSnippets?.start
						?.map((s) => `${s.title}.`)
						.join(" ") || ""
				);
			case "code-end":
				return (
					this.config.codeSnippets?.end?.map((s) => `${s.title}.`).join(" ") ||
					""
				);
			case "analysis":
				return (
					"Key architectural changes: " +
					(this.config.architecturalChanges?.join(". ") || "")
				);
			case "confirmation":
				return `Level complete! You have obtained ${this.config.reward?.name || "a new object"}.`;
			default:
				return "";
		}
	}

	getSlides() {
		const sequence = [];
		if (this.config.description) {
			sequence.push("narrative");
		}
		if (this.config.codeSnippets?.start) {
			sequence.push("code-start");
		}
		if (this.config.problemDesc) {
			sequence.push("problem");
		}
		if (this.config.codeSnippets?.end) {
			sequence.push("code-end");
		}
		if (
			this.config.architecturalChanges &&
			this.config.architecturalChanges.length > 0
		) {
			sequence.push("analysis");
		}
		sequence.push("confirmation");
		return sequence;
	}

	dispatchComplete() {
		this.dispatchEvent(
			new CustomEvent("complete", { bubbles: true, composed: true }),
		);
	}

	dispatchClose() {
		this.dispatchEvent(
			new CustomEvent("close", { bubbles: true, composed: true }),
		);
	}

	static styles = styles;

	/**
	 * @typedef {import('../content/quests/quest-types.js').CodeSnippet} CodeSnippet
	 */

	/**
	 * Renders a code snippet
	 * @param {CodeSnippet} snippet - The code snippet to render
	 * @param {string} type - The type of the code snippet
	 * @returns {import("lit").TemplateResult} The rendered code snippet
	 */
	renderCode({ title = "Identified Problem", code, language = "js" }, type) {
		return html`
			<h6 class="slide-title ${type}">${title}</h6>
			<!-- @ts-ignore -->
			<syntax-highlight language="${language}" class="${type}" .innerHTML=${escapeHtml(code)}></syntax-highlight>
		`;
	}

	/**
	 * Renders the content of a slide
	 * @param {string} type - The type of the slide
	 * @returns {import("lit").TemplateResult|Iterable<unknown>} The rendered slide content
	 */
	renderSlideContent(type) {
		switch (type) {
			case "code-start":
				return map(
					this.config.codeSnippets?.start,
					(/** @type {CodeSnippet} */ snippet) =>
						this.renderCode(snippet, type),
				);
			case "code-end":
				return map(
					this.config.codeSnippets?.end,
					(/** @type {CodeSnippet} */ snippet) =>
						this.renderCode(snippet, type),
				);
			case "problem":
				return html`
					<div class= "slide-content-centered">
					<div class="narrative-icon problem-icon">
						<wa-icon name="triangle-exclamation" class="problem-icon-inner"></wa-icon>
					</div>
            ${this.config.problemDesc}
          </div >
					`;
			case "narrative":
				return html`
					<div class= "slide-content-centered">
					<div class="narrative-icon">
						<wa-icon name="scroll" class="narrative-icon-inner"></wa-icon>
					</div>
            ${this.config.description}
          </div >
					`;
			case "analysis":
				return html`
					<h6 class= "slide-title-analysis" > Key Architectural Changes</h6>
				<div class="analysis-list">
					${this.config.architecturalChanges?.map(
						(change) => html`
                <div class="analysis-item">
                  <wa-icon name="arrow-right" class="analysis-arrow"></wa-icon>
                  <span>${change}</span>
                </div>
              `,
					)}
				</div>
        `;
			case "confirmation":
				return html`
          <div class="slide-content-between">
            <div></div>
                    <div class="quest-complete-container">
                      <h2 class="quest-complete-title">Level Complete!</h2>
                      ${
												this.config.reward
													? html`
                        <div class="reward-preview">
                          <img src="${processImagePath(this.config.reward.image)}" alt="${this.config.reward.name}" class="reward-img" />
                          <div class="reward-info">
                            <h6 class="reward-name">${this.config.reward.name}</h6>
                            <p class="reward-desc">Acquired! This item has been added to your inventory.</p>
                          </div>
                        </div>
                      `
													: ""
											}
                    </div>

            <div class="spacer-top"></div>
          </div>
        `;
			default:
				return /** @type {any} */ (null);
		}
	}

	render() {
		const slides = this.getSlides();
		const currentSlideType = slides[this.slideIndex];

		return html`
      <wa-dialog 
        label="${this.config.title}" 
        open
        style="--width: 80ch; --body-spacing: 0;"
        @wa-request-close="${(/** @type {Event} */ e) => e.preventDefault()}"
        @wa-after-hide="${this.dispatchClose}"
      >
        <div class="dialog-content">
            <!-- Content -->
            <div class="content-container wa-stack wa-gap-xs">
            ${this.renderSlideContent(currentSlideType)}
            </div>
        </div>

        <!-- Footer -->
        <div slot="footer" class="footer">
          <wa-button 
            .variant="${"neutral"}"
            ?disabled="${this.slideIndex === 0}"
            @click="${() => this.slideIndex--}"
          >
            <wa-icon slot="start" name="arrow-left"></wa-icon>
            PREV
          </wa-button>
          
          <!-- Indicators -->
          <div class="indicators">
            ${slides.map(
							(_, i) => html`
              <div class="indicator ${i === this.slideIndex ? "active" : "inactive"}"></div>
            `,
						)}
          </div>
          
          ${
						this.slideIndex === slides.length - 1
							? html`
            <wa-button 
                .variant="${"brand"}"
                @click="${this.dispatchComplete}"
                style="--border-radius: 0; animation: bounce 1s infinite;"
            >
                EVOLVE
                <wa-icon slot="end" name="arrow-right"></wa-icon>
            </wa-button>
          `
							: html`
            <wa-button 
				.variant="${"brand"}"
                @click="${() => this.slideIndex++}"
            >
                NEXT
                <wa-icon slot="end" name="arrow-right"></wa-icon>
            </wa-button>
          `
					}
        </div>
      </wa-dialog>
    `;
	}
}

customElements.define("level-dialog", LevelDialog);
