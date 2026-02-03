import { html } from "lit";
import "./level-dialog-slide-code.js";

export default {
	title: "Components/Game/LevelDialog/Slides/Code",
	component: "level-dialog-slide-code",
	argTypes: {
		type: {
			control: { type: "select" },
			options: ["start", "end"],
		},
	},
};

/** @param {any} args */
const Template = (args) => html`
  <div style="width: 600px; height: 400px; padding: 20px; background: #fff; border: 1px solid #ccc; position: relative; overflow: auto;">
    <level-dialog-slide-code
      .type="${args.type}"
      .snippets="${args.snippets}"
    ></level-dialog-slide-code>
  </div>
`;

/** @type {{args: any, render: any}} */
export const Start = {
	render: Template,
	args: {
		type: "start",
		snippets: [
			{
				title: "Legacy Implementation",
				// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional
				code: 'function render() {\n  const el = document.getElementById("app");\n  el.innerHTML = `<div>Hello ${name}</div>`;\n}',
				language: "javascript",
			},
		],
	},
};

/** @type {{args: any, render: any}} */
export const End = {
	render: Template,
	args: {
		type: "end",
		snippets: [
			{
				title: "Clean Implementation",
				// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional
				code: "export class MyComponent extends LitElement {\n  render() {\n    return html`<div>Hello ${this.name}</div>`;\n  }\n}",
				language: "javascript",
			},
		],
	},
};
