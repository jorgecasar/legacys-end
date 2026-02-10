import { html } from "lit";
import { questControllerContext } from "../../../contexts/quest-controller-context.js";
import { gameStoreContext } from "../../../core/store.js";
import "../../../utils/context-provider.js";
import "./game-exit-zone.js";

export default {
	title: "Components/Game/GameExitZone",
	component: "game-exit-zone",
};

/** @param {any} args */
const Template = (args) => {
	const mockQuestController = {
		currentChapter: {
			exitZone: { x: args.x, y: args.y, width: 10, height: 10, label: "EXIT" },
		},
	};
	const mockGameStore = {
		quest: {
			hasCollectedItem: { get: () => args.active },
		},
	};

	return html`
    <div style="width: 100%; height: 300px; position: relative; background: #222; border: 1px dashed #444;">
      <context-provider .context="${questControllerContext}" .value="${mockQuestController}">
        <context-provider .context="${gameStoreContext}" .value="${mockGameStore}">
          <game-exit-zone></game-exit-zone>
        </context-provider>
      </context-provider>
    </div>
  `;
};

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		x: 80,
		y: 40,
		active: true,
	},
};
