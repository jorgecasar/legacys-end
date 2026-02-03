import { html } from "lit";
import "./level-dialog-slide-confirmation.js";

export default {
	title: "Components/Game/LevelDialog/Slides/Confirmation",
	component: "level-dialog-slide-confirmation",
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; height: 400px; padding: 20px; background: #fff; border: 1px solid #ccc; position: relative; overflow: auto;">
    <level-dialog-slide-confirmation
      .reward="${args.reward}"
    ></level-dialog-slide-confirmation>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		reward: {
			name: "Debugger Talisman",
			image: "/assets/swamp-of-scope/reward.png",
		},
	},
};
