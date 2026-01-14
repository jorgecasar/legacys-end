import { msg } from "@lit/localize";
import { ServiceType } from "../../../services/user-services.js";

/**
 * The Token of Agnosticism Quest - Chapter Data
 *
 * This quest teaches Design Tokens and visual adaptation:
 * - Level 2: CSS Custom Properties, Design Tokens, Dark Mode
 */

/** @typedef {import("../quest-types.js").LevelConfig} LevelConfig */

/** @returns {Record<string, LevelConfig>} */
export const getChromaticLoomChapters = () => ({
	"fortress-of-design": {
		id: "fortress-of-design",
		title: msg("The Fortress of Design"),
		description: msg(
			"Represents diverse Design Systems. Use Design Tokens (CSS Variables) to unify styles and enable Dark Mode.",
		),
		problemTitle: msg("Rigid Structure"),
		problemDesc: msg("Start by selecting the element to inspect its styles."),
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
					title: msg("Hardcoded Colors"),
					code: `/* ❌ Hardcoded Colors */
.tunic {
    background-color: #1e3a8a; /* Blue */
}

/* No easy way to change theme without overriding styles */`,
				},
			],
			end: [
				{
					title: msg("Design Tokens (CSS Vars)"),
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
			label: msg("Hall of Definition"),
		},
		backgroundStyle: "url('/assets/fortress-of-design/background.png')",
		npc: {
			name: msg("Style Guardian"),
			icon: "shield",
			image: "/assets/fortress-of-design/npc.png",
			position: { x: 50, y: 50 },
		},
		reward: {
			name: msg("Trunk"),
			image: "/assets/fortress-of-design/reward.png",
			position: { x: 56, y: 50 },
		},
		hero: { image: "/assets/fortress-of-design/hero.png" },
	},
});

/** @deprecated Use getChromaticLoomChapters() instead */
export const THE_CHROMATIC_LOOM_CHAPTERS = getChromaticLoomChapters();
