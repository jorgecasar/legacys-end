import { Signal } from "@lit-labs/signals";
import { html } from "lit";
import { localizationContext } from "../../contexts/localization-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import "../../utils/context-provider.js";
import "./quest-view.js";

export default {
	title: "Pages/QuestView",
	component: "quest-view",
	parameters: {
		layout: "fullscreen",
	},
};

const mockQuest = {
	id: "the-aura-of-sovereignty",
	name: "The Aura of Sovereignty",
};

const mockQuestController = {
	currentChapter: {
		id: "storybook-chapter",
		title: "Storybook Training",
		backgroundStyle: "url(/assets/swamp-of-scope/background.png)",
		hero: { image: "/assets/swamp-of-scope/hero.png" },
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
	completeChapter: () => console.log("Chapter complete"),
	advanceChapter: () => Promise.resolve(),
};

const mockQuestState = {
	hasCollectedItem: new Signal.State(false),
	isRewardCollected: new Signal.State(false),
	isQuestCompleted: new Signal.State(false),
	currentChapterNumber: new Signal.State(1),
	totalChapters: new Signal.State(3),
	levelTitle: new Signal.State("The Swamp of Global Scope"),
	questTitle: new Signal.State("The Aura of Sovereignty"),
	setLockedMessage: () => {},
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
	setCurrentDialogText: () => {},
	setNextDialogText: () => {},
	nextSlide: () => {},
	prevSlide: () => {},
};

const mockThemeService = {
	themeMode: new Signal.State("light"),
};

const mockSessionService = {
	currentQuest: new Signal.State(mockQuest),
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
        <context-provider .context="${questStateContext}" .value="${mockQuestState}">
          <context-provider .context="${heroStateContext}" .value="${mockHeroState}">
            <context-provider .context="${worldStateContext}" .value="${mockWorldState}">
              <context-provider .context="${themeContext}" .value="${mockThemeService}">
                <context-provider .context="${sessionContext}" .value="${mockSessionService}">
                  <context-provider .context="${localizationContext}" .value="${mockLocalizationService}">
                    <quest-view style="height: 100%; width: 100%;"></quest-view>
                  </context-provider>
                </context-provider>
              </context-provider>
            </context-provider>
          </context-provider>
        </context-provider>
      </context-provider>
    </div>
  `,
};

/** @type {{render: any}} */
export const Victory = {
	render: () => {
		const victoryQuestState = {
			...mockQuestState,
			isQuestCompleted: new Signal.State(true),
		};
		return html`
      <div style="width: 100vw; height: 100vh; background: #222;">
        <context-provider .context="${questControllerContext}" .value="${mockQuestController}">
          <context-provider .context="${questStateContext}" .value="${victoryQuestState}">
            <context-provider .context="${heroStateContext}" .value="${mockHeroState}">
              <context-provider .context="${worldStateContext}" .value="${mockWorldState}">
                <context-provider .context="${themeContext}" .value="${mockThemeService}">
                  <context-provider .context="${sessionContext}" .value="${mockSessionService}">
                    <context-provider .context="${localizationContext}" .value="${mockLocalizationService}">
                      <quest-view style="height: 100%; width: 100%;"></quest-view>
                    </context-provider>
                  </context-provider>
                </context-provider>
              </context-provider>
            </context-provider>
          </context-provider>
        </context-provider>
      </div>
    `;
	},
};
