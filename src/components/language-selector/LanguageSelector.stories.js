import { html } from "lit";
import "./language-selector.js";

export default {
	title: "Components/UI/LanguageSelector",
	component: "language-selector",
	argTypes: {
		currentLocale: {
			control: { type: "select" },
			options: ["en", "es"],
		},
	},
};

/** @param {any} args */
const Template = (args) => {
	const mockLocalizationService = {
		getLocale: () => args.currentLocale,
		/** @param {any} l */
		setLocale: (l) => {
			console.log("setLocale", l);
			args.currentLocale = l;
		},
	};

	return html`
    <div style="width: 200px;">
      <language-selector .localizationService="${mockLocalizationService}"></language-selector>
    </div>
  `;
};

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		currentLocale: "en",
	},
};
