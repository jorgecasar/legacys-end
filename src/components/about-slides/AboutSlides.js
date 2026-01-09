import { html, LitElement } from "lit";
import { ABOUT_SLIDES_CONTENT } from "../../content/about-content.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/carousel/carousel.js";
import "@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { aboutSlidesStyles } from "./AboutSlides.styles.js";

/**
 * AboutSlides - Displays information about the game in a carousel dialog
 *
 * @element about-slides
 */
export class AboutSlides extends LitElement {
	static styles = aboutSlidesStyles;

	render() {
		return html`
			<wa-dialog label="About Legacy's End" class="about-dialog" style="--width: 800px;">
				<wa-carousel navigation pagination mouseDragging>
					${ABOUT_SLIDES_CONTENT.map(
						(slide) => html`
						<wa-carousel-item>
							<h2>${slide.title}</h2>
							${slide.lines.map((line) => html`<p>${line}</p>`)}
						</wa-carousel-item>
					`,
					)}
				</wa-carousel>
			</wa-dialog>
		`;
	}

	/**
	 * Show the about dialog
	 */
	show() {
		const dialog =
			/** @type {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} */ (
				this.shadowRoot?.querySelector("wa-dialog")
			);
		if (dialog) {
			dialog.open = true;
		}
	}

	/**
	 * Hide the about dialog
	 */
	hide() {
		const dialog =
			/** @type {import("@awesome.me/webawesome/dist/components/dialog/dialog.js").default} */ (
				this.shadowRoot?.querySelector("wa-dialog")
			);
		if (dialog) {
			dialog.open = false;
		}
	}
}
