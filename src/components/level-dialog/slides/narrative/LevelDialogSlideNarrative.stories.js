import { html } from "lit";
import "./level-dialog-slide-narrative.js";

export default {
	title: "Components/Game/LevelDialog/Slides/Narrative",
	component: "level-dialog-slide-narrative",
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; height: 400px; padding: 20px; background: #fff; border: 1px solid #ccc; position: relative; overflow: auto;">
    <level-dialog-slide-narrative
      .description="${args.description}"
    ></level-dialog-slide-narrative>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		description:
			"Before Alarion can connect with others, he must learn to exist without being corrupted by them. In the Toxic Swamp of Global Scope, he must find an umbrella to protect his styles and DOM from the chaotic environment.",
	},
};
