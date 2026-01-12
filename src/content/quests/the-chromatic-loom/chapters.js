import { ServiceType } from "../../../services/user-services.js";

/**
 * The Token of Agnosticism Quest - Chapter Data
 *
 * This quest teaches Design Tokens and visual adaptation:
 * - Level 2: CSS Custom Properties, Design Tokens, Dark Mode
 *
import { ActionType, InteractionType } from "../quest-types.js";

/** @typedef {import("../quest-types.js").LevelConfig} LevelConfig */

/** @type {Record<string, LevelConfig>} */
export const THE_CHROMATIC_LOOM_CHAPTERS = {
	"fortress-of-design": {
		id: "fortress-of-design",
		title: "The Fortress of Design",
		description:
			"Represents diverse Design Systems. Use Design Tokens (CSS Variables) to unify styles and enable Dark Mode.",
		problemTitle: "Rigid Structure",
		problemDesc: "Start by selecting the element to inspect its styles.",
		zones: [
			{
				x: 0,
				y: 0,
				width: 100,
				height: 25,
				type: "THEME_CHANGE",
				payload: "dark",
				requiresItem: true,
			},
			{
				x: 0,
				y: 25,
				width: 100,
				height: 75,
				type: "THEME_CHANGE",
				payload: "light",
				requiresItem: true,
			},
		],
		codeSnippets: {
			start: [
				{
					title: "Hardcoded Colors",
					code: `/* ❌ Hardcoded Colors */
.tunic {
    background-color: #1e3a8a; /* Blue */
}

/* No easy way to change theme without overriding styles */`,
				},
			],
			end: [
				{
					title: "Design Tokens (CSS Vars)",
					code: `/* ✅ Design Tokens (CSS Vars) */
:host {
    --tunic-color: #1e3a8a;
}

:host(.dark-theme) {
    --tunic-color: #818cf8; /* Neon */
}

.tunic {
    background: var(--tunic-color);
}`,
				},
			],
		},
		stats: { maintainability: 25, portability: 35 },
		serviceType: ServiceType.LEGACY,
		startPos: { x: 50, y: 15 },
		exitZone: {
			x: 95,
			y: 50,
			width: 10,
			height: 20,
			label: "Hall of Definition",
		},
		backgroundStyle: "url('/assets/fortress-of-design/background.png')",
		npc: {
			name: "Style Guardian",
			icon: "shield",
			image: "/assets/fortress-of-design/npc.png",
			position: { x: 50, y: 50 },
		},
		reward: {
			name: "Trunk",
			image: "/assets/fortress-of-design/reward.png",
			position: { x: 56, y: 50 },
		},
		hero: { image: "/assets/fortress-of-design/hero.png" },
	},
};
