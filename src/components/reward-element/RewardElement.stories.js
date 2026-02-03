import { html } from "lit";
import "./reward-element.js";

export default {
	title: "Components/Game/RewardElement",
	component: "reward-element",
	argTypes: {
		x: { control: { type: "range", min: 0, max: 100 } },
		y: { control: { type: "range", min: 0, max: 100 } },
	},
};

/** @param {any} args */
const Template = (args) => html`
  <div style="position: relative; width: 300px; height: 300px; background: #eee; border: 1px dashed #ccc;">
    <reward-element
      .image="${args.image}"
      .x="${args.x}"
      .y="${args.y}"
    ></reward-element>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		image: "/assets/swamp-of-scope/reward.png",
		x: 50,
		y: 50,
	},
};
