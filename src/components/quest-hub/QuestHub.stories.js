import { html } from "lit";
import "./quest-hub.js";

export default {
	title: "Pages/QuestHub",
	component: "quest-hub",
};

const mockQuests = [
	{
		id: "the-aura-of-sovereignty",
		name: "The Aura of Sovereignty",
		description: "Master the art of encapsulation and service decoupling.",
		image: "/assets/swamp-of-scope/quest-card.png",
		status: "available",
	},
	{
		id: "fortress-of-design",
		name: "Fortress of Design",
		description: "Learn to build scalable design systems with CSS Tokens.",
		image: "/assets/fortress-of-design/quest-card.png",
		status: "locked",
	},
];

const mockComingSoon = [
	{
		id: "temple-of-inversion",
		name: "Temple of Inversion",
		description: "Unlock the secrets of Dependency Injection.",
		image: "/assets/temple-of-inversion/quest-card.png",
		status: "coming-soon",
	},
];

const mockLocalizationService = {
	getLocale: () => "en",
	/** @param {any} l */
	setLocale: (l) => console.log("setLocale", l),
};

export const Default = {
	/** @param {any} args */
	render: (args) => html`
    <quest-hub 
      .quests="${args.quests}" 
      .comingSoonQuests="${args.comingSoonQuests}"
      .localizationService="${args.localizationService}"
    ></quest-hub>
  `,
	args: {
		quests: mockQuests,
		comingSoonQuests: mockComingSoon,
		localizationService: mockLocalizationService,
	},
};

export const Empty = {
	render: () =>
		html`<quest-hub .localizationService="${mockLocalizationService}"></quest-hub>`,
};
