import { html } from "lit";
import { worldStateContext } from "../../game/contexts/world-context.js";
import "../../utils/context-provider.js";
import "./pause-menu.js";

export default {
	title: "Components/UI/PauseMenu",
	component: "pause-menu",
	parameters: {
		layout: "fullscreen",
	},
};

export const Open = {
	render: () => html`<pause-menu></pause-menu>`,
	decorators: [
		/** @param {any} story */
		(story) => {
			const mockWorldState = {
				isPaused: { get: () => true },
				setPaused: () => {},
				restart: () => {},
				returnToHub: () => {},
			};
			return html`
        <div style="width: 100vw; height: 100vh; background: #222; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-family: 'Pixel', sans-serif;">The game is background-paused</p>
          <context-provider .context="${worldStateContext}" .value="${mockWorldState}">
            ${story()}
          </context-provider>
        </div>
      `;
		},
	],
};
