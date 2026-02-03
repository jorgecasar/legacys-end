import { html } from "lit";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import "../../utils/context-provider.js";
import "./victory-screen.js";

export default {
	title: "Components/UI/VictoryScreen",
	component: "victory-screen",
};

const mockQuest = {
	name: "The Swamp of Scope",
	chapterIds: ["chapter-1", "chapter-2"],
	chapters: {
		"chapter-1": {
			reward: {
				name: "Debugger Talisman",
				image: "/assets/swamp-of-scope/reward.png",
			},
		},
		"chapter-2": {
			reward: {
				name: "Clean Code Scroll",
				image: "/assets/swamp-of-scope/reward.png",
			},
		},
	},
	reward: {
		badge: "Scope Navigator",
		ability: "Contextual Awareness",
	},
};

const mockSessionService = {
	currentQuest: { get: () => mockQuest },
};

const mockQuestController = {
	returnToHub: () => console.log("Returning to hub..."),
};

export const Default = {
	render: () => html`
    <context-provider .context="${sessionContext}" .value="${mockSessionService}">
      <context-provider .context="${questControllerContext}" .value="${mockQuestController}">
        <victory-screen></victory-screen>
      </context-provider>
    </context-provider>
  `,
};
