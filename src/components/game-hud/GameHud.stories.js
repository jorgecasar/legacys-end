import { Signal } from "@lit-labs/signals";
import { html } from "lit";
import "./game-hud.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";

export default {
	title: "Components/Game/GameHud",
	component: "game-hud",
	decorators: [
		/** @param {any} story */
		(story) => html`
      <div class="wa-theme-pixel wa-light sl-theme-light" style="padding: 2rem; background: #fff;">
        ${story()}
      </div>
    `,
	],
};

/** @param {any} args */
const Template = (args) => {
	const questState = /** @type {any} */ ({
		currentChapterNumber: new Signal.State(args.currentChapterNumber),
		totalChapters: new Signal.State(args.totalChapters),
		levelTitle: new Signal.State(args.levelTitle),
		questTitle: new Signal.State(args.questTitle),
	});

	setTimeout(() => {
		const el = /** @type {any} */ (document.querySelector("game-hud"));
		if (el) {
			el.questState = questState;
			el.requestUpdate();
		}
	}, 0);

	return html`<game-hud></game-hud>`;
};

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		currentChapterNumber: 1,
		totalChapters: 3,
		levelTitle: "The Swamp of Global Scope",
		questTitle: "The Aura of Sovereignty",
	},
};

/** @type {{args: any, render: any}} */
export const MiddleChapter = {
	render: Template,
	args: {
		...Default.args,
		currentChapterNumber: 2,
	},
};
