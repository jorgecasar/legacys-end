import { TOKEN_OF_AGNOSTICISM_METADATA } from "../quest-manifest.js";

import { THE_CHROMATIC_LOOM_CHAPTERS } from "./chapters.js";

/**
 * The Token of Agnosticism Quest Metadata
 *
 * Teaches Design Tokens and visual adaptation
 */
/** @type {import("../quest-types.js").Quest} */
export const TOKEN_OF_AGNOSTICISM_QUEST = {
	...TOKEN_OF_AGNOSTICISM_METADATA,
	legacyProblem:
		"Hardcoded styles, inability to adapt to Dark Mode or different branding requirements.",
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: "20-30 min",
	concepts: ["Design Tokens", "CSS Custom Properties", "Programmatic Theming"],

	// Chapter IDs
	chapterIds: ["fortress-of-design"],

	// Chapter data
	chapters: THE_CHROMATIC_LOOM_CHAPTERS,

	reward: {
		badge: "Visually Agnostic",
		description: "Visually agnostic and adaptable component",
		ability: "Visual Adaptation",
	},
};
