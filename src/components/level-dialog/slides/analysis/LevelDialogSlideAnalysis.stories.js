import { html } from "lit";
import "./level-dialog-slide-analysis.js";

export default {
	title: "Components/Game/LevelDialog/Slides/Analysis",
	component: "level-dialog-slide-analysis",
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; height: 400px; padding: 20px; background: #fff; border: 1px solid #ccc; position: relative; overflow: auto;">
    <level-dialog-slide-analysis
      .architecturalChanges="${args.architecturalChanges}"
    ></level-dialog-slide-analysis>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		architecturalChanges: [
			"Use Context API for dependency injection",
			"Implement Signals for fine-grained reactivity",
			"Encapsulate styles using Shadow DOM",
		],
	},
};
