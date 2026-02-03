import { html } from "lit";
import "./about-slides.js";

export default {
	title: "Components/UI/AboutSlides",
	component: "about-slides",
};

export const Default = {
	render: () => html`
    <div>
      <wa-button @click="${() => /** @type {any} */ (document.querySelector("about-slides"))?.show()}">Show About</wa-button>
      <about-slides></about-slides>
    </div>
  `,
};

export const Open = {
	render: () => html`<about-slides></about-slides>`,
	/** @param {any} context */
	play: async ({ canvasElement }) => {
		const aboutSlides = /** @type {any} */ (
			canvasElement.querySelector("about-slides")
		);
		if (aboutSlides) {
			aboutSlides.show();
		}
	},
};
