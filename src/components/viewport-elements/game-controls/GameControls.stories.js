import { html } from "lit";
import "./game-controls.js";

export default {
	title: "Components/Game/GameControls",
	component: "game-controls",
	parameters: {
		layout: "fullscreen",
	},
};

export const Default = {
	render: () => html`
    <div style="width: 100%; height: 200px; position: relative; background: #333;">
      <game-controls></game-controls>
    </div>
  `,
};

export const Touch = {
	render: () => html`
    <div style="width: 100%; height: 300px; position: relative; background: #333;">
      <game-controls></game-controls>
    </div>
  `,
	play: async () => {
		// We can't easily force the signal state from outside unless we expose it
		// but we can try to find the button if the toggle is rendered
	},
};
