import { Signal } from "@lit-labs/signals";
import { html } from "lit";
import { localizationContext } from "../../contexts/localization-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { gameStoreContext } from "../../state/game-store.js";
import "../../utils/context-provider.js";
import "./game-viewport.js";

export default {
	title: "Components/Game/GameViewport",
	component: "game-viewport",
};

const mockQuestController = {
	currentChapter: {
		id: "storybook-chapter",
		title: "Storybook Training",
		backgroundStyle: "url(/assets/swamp-of-scope/background.png)",
		hero: {
			image: "/assets/swamp-of-scope/hero.png",
		},
		npc: {
			name: "The Rainwalker",
			image: "/assets/swamp-of-scope/npc.png",
			position: { x: 70, y: 50 },
		},
		reward: {
			name: "Umbrella",
			image: "/assets/swamp-of-scope/reward.png",
			position: { x: 30, y: 50 },
		},
		exitZone: { x: 90, y: 50, width: 10, height: 10, label: "EXIT" },
	},
};

const mockQuestState = {
	hasCollectedItem: new Signal.State(false),
	isRewardCollected: new Signal.State(false),
	currentChapterNumber: new Signal.State(1),
	totalChapters: new Signal.State(3),
	levelTitle: new Signal.State("The Swamp of Global Scope"),
	questTitle: new Signal.State("The Aura of Sovereignty"),
};

const mockHeroState = {
	pos: new Signal.State({ x: 50, y: 50 }),
	imageSrc: new Signal.State("/assets/swamp-of-scope/hero.png"),
	isEvolving: new Signal.State(false),
	hotSwitchState: new Signal.State(null),
	setImageSrc: () => {},
	setPos: () => {},
};

const mockWorldState = {
	showDialog: new Signal.State(false),
	isPaused: new Signal.State(false),
	currentDialogText: new Signal.State(""),
	nextDialogText: new Signal.State(""),
	/** @param {any} v */
	setShowDialog: (v) => mockWorldState.showDialog.set(v),
	/** @param {any} v */
	setPaused: (v) => mockWorldState.isPaused.set(v),
};

const mockGameStore = {
	hero: mockHeroState,
	quest: mockQuestState,
	world: mockWorldState,
};

const mockThemeService = {
	themeMode: new Signal.State("light"),
};

const mockSessionService = {
	currentQuest: new Signal.State(null),
	isLoading: new Signal.State(false),
	isInHub: new Signal.State(false),
};

const mockLocalizationService = {
	getLocale: () => "en",
	/** @param {any} s */
	t: (s) => s,
};

/** @type {{render: any}} */
export const Default = {
	render: () => html`
    <div style="width: 100vw; height: 100vh; background: #222;">
      <context-provider .context="${questControllerContext}" .value="${mockQuestController}">
        <context-provider .context="${gameStoreContext}" .value="${mockGameStore}">
          <context-provider .context="${themeContext}" .value="${mockThemeService}">
            <context-provider .context="${sessionContext}" .value="${mockSessionService}">
              <context-provider .context="${localizationContext}" .value="${mockLocalizationService}">
                <game-viewport style="height: 100%; width: 100%;"></game-viewport>
              </context-provider>
            </context-provider>
          </context-provider>
        </context-provider>
      </context-provider>
    </div>
  `,
};
