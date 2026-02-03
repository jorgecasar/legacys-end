import { html } from "lit";
import "./legacys-end-app.js";

export default {
	title: "Pages/LegacysEndApp",
	component: "legacys-end-app",
	parameters: {
		layout: "fullscreen",
	},
};

/** @type {{render: any, play?: any}} */
export const Default = {
	render: () => html`
    <legacys-end-app></legacys-end-app>
  `,
};

/** @type {{render: any, play?: any}} */
export const Loading = {
	render: () => html`
    <legacys-end-app></legacys-end-app>
  `,
	/** @param {any} context */
	play: async ({ canvasElement }) => {
		const app = /** @type {any} */ (
			canvasElement.querySelector("legacys-end-app")
		);
		if (app?.sessionService) {
			app.sessionService.setLoading(true);
		}
	},
};
