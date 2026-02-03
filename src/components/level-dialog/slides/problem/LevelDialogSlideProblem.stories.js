import { html } from "lit";
import "./level-dialog-slide-problem.js";

export default {
	title: "Components/Game/LevelDialog/Slides/Problem",
	component: "level-dialog-slide-problem",
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; height: 400px; padding: 20px; background: #fff; border: 1px solid #ccc; position: relative; overflow: auto;">
    <level-dialog-slide-problem
      .problemDesc="${args.problemDesc}"
    ></level-dialog-slide-problem>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		problemDesc:
			"The components are too coupled to the main application! Any change in the global scope might break the hero profile.",
	},
};
