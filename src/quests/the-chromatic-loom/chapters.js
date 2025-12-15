import { FORTRESS_OF_DESIGN_CONTENT } from "../../content/chapters-content.js";
import { ServiceType } from "../../types.js";

/**
 * The Token of Agnosticism Quest - Chapter Data
 *
 * This quest teaches Design Tokens and visual adaptation:
 * - Level 2: CSS Custom Properties, Design Tokens, Dark Mode
 *
 * Future chapters will expand on theming concepts
 */

export const THE_CHROMATIC_LOOM_CHAPTERS = {
	"fortress-of-design": {
		id: "fortress-of-design",
		title: "The Fortress of Design",
		description:
			"The object symbolizing the variety of external Design Systems. Interacting reveals the need for CSS Custom Properties (Design Tokens) to achieve visual consistency and thematic adaptation (Dark Mode).",
		hasThemeZones: true,
		codeSnippetStart: FORTRESS_OF_DESIGN_CONTENT.codeSnippetStart,
		codeSnippetEnd: FORTRESS_OF_DESIGN_CONTENT.codeSnippetEnd,
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
		backgroundStyle:
			"url('/assets/fortress-of-design/background.png') center / cover no-repeat",
		npc: {
			name: "Style Guardian",
			icon: "shield",
			image: "/assets/fortress-of-design/npc.png",
			position: { x: 50, y: 50 },
		},
		reward: {
			name: "Trunk",
			icon: "box",
			image: "/assets/fortress-of-design/reward.png",
			position: { x: 56, y: 50 },
		},
		hero: { image: "/assets/fortress-of-design/hero.png" },
	},
};
