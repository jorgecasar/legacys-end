import { html } from "lit";
import { gameStoreContext } from "../../core/store.js";
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
			const mockGameStore = {
				world: {
					isPaused: { get: () => true },
					setPaused: () => {},
					restart: () => {},
					returnToHub: () => {},
				},
			};
			return html`
        <div style="width: 100vw; height: 100vh; background: #222; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-family: 'Pixel', sans-serif;">The game is background-paused</p>
          <context-provider .context="${gameStoreContext}" .value="${mockGameStore}">
            ${story()}
          </context-provider>
        </div>
      `;
		},
	],
};
