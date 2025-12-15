import { css, html, LitElement } from "lit";
import { ABOUT_SLIDES_CONTENT } from "../content/about-content.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/carousel/carousel.js";
import "@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { sharedStyles } from "../styles/shared.js";

export class AboutSlides extends LitElement {
	static styles = [
		...sharedStyles,
		css`
			:host {
				display: block;
			}

			wa-carousel {
				--aspect-ratio: 16/9;
				width: 100%;
			}

			wa-carousel-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				text-align: center;
				padding: 2rem;
				background-color: var(--wa-color-neutral-fill-loud);
				color: var(--wa-color-text-normal);
			}

			h2 {
				font-family: 'Press Start 2P', monospace;
				font-size: 1.5rem;
				margin-bottom: 1rem;
				color: var(--wa-color-primary-text);
			}

			p {
				font-family: var(--wa-font-sans);
				font-size: 1.2rem;
				line-height: 1.6;
				margin-bottom: 1rem;
			}

			ul {
				list-style-type: none;
				padding: 0;
			}

			li {
				margin: 0.5rem 0;
				font-size: 1.1rem;
			}
		`,
	];

	render() {
		return html`
			<wa-dialog label="About Legacy's End" class="about-dialog" style="--width: 800px;">
				<wa-carousel navigation pagination mouseDragging>
					${ABOUT_SLIDES_CONTENT.map((slide) => html`
						<wa-carousel-item>
							<h2>${slide.title}</h2>
							${slide.lines.map((line) => html`<p>${line}</p>`)}
						</wa-carousel-item>
					`)}
				</wa-carousel>
			</wa-dialog>
		`;
	}

	show() {
		const dialog = this.shadowRoot.querySelector("wa-dialog");
		if (dialog) {
			dialog.show();
		}
	}

	hide() {
		const dialog = this.shadowRoot.querySelector("wa-dialog");
		if (dialog) {
			dialog.hide();
		}
	}
}

customElements.define("about-slides", AboutSlides);
