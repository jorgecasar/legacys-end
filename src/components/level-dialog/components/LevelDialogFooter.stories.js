import { html } from "lit";
import "./LevelDialogFooter.js";

export default {
	title: "Components/Game/LevelDialog/Footer",
	component: "level-dialog-footer",
	argTypes: {
		currentSlideIndex: { control: { type: "number", min: 0, max: 4 } },
	},
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; padding: 20px; background: #fff; border: 1px solid #ccc;">
    <level-dialog-footer
      .slides="${args.slides}"
      .currentSlideIndex="${args.currentSlideIndex}"
    ></level-dialog-footer>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		slides: ["narrative", "problem", "analysis", "code", "confirmation"],
		currentSlideIndex: 0,
	},
};

/** @type {{args: any, render: any}} */
export const LastSlide = {
	render: Template,
	args: {
		...Default.args,
		currentSlideIndex: 4,
	},
};
