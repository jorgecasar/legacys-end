import { html } from "lit";
import "./hero-profile.js";

export default {
	title: "Components/Game/HeroProfile",
	component: "hero-profile",
	argTypes: {
		hotSwitchState: {
			control: { type: "select" },
			options: ["legacy", "mock", "new", "none"],
		},
		imageSrc: {
			control: "text",
		},
	},
};

/** @param {any} args */
const Template = (args) => html`
  <div style="position: relative; width: 300px; height: 300px; background: #eee; border: 1px dashed #ccc;">
    <hero-profile
      .imageSrc="${args.imageSrc}"
      .hotSwitchState="${args.hotSwitchState === "none" ? undefined : args.hotSwitchState}"
    ></hero-profile>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		imageSrc: "/assets/swamp-of-scope/hero.png",
		hotSwitchState: "none",
	},
};

/** @type {{args: any, render: any}} */
export const Legacy = {
	render: Template,
	args: {
		...Default.args,
		hotSwitchState: "legacy",
	},
};

/** @type {{args: any, render: any}} */
export const Modern = {
	render: Template,
	args: {
		...Default.args,
		hotSwitchState: "new",
	},
};
