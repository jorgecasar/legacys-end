import { html } from "lit";
import "./npc-element.js";

export default {
	title: "Components/Game/NpcElement",
	component: "npc-element",
	argTypes: {
		isClose: { control: "boolean" },
		x: { control: { type: "range", min: 0, max: 100 } },
		y: { control: { type: "range", min: 0, max: 100 } },
	},
};

/** @param {any} args */
const Template = (args) => html`
  <div style="position: relative; width: 300px; height: 300px; background: #eee; border: 1px dashed #ccc;">
    <npc-element
      .name="${args.name}"
      .image="${args.image}"
      .icon="${args.icon}"
      .x="${args.x}"
      .y="${args.y}"
      .isClose="${args.isClose}"
    ></npc-element>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		name: "The Rainwalker",
		image: "/assets/swamp-of-scope/npc.png",
		icon: "user",
		x: 50,
		y: 50,
		isClose: false,
	},
};

/** @type {{args: any, render: any}} */
export const Interactive = {
	render: Template,
	args: {
		...Default.args,
		isClose: true,
	},
};
