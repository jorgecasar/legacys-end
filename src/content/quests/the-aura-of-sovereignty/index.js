import { THE_AURA_OF_SOVEREIGNTY_METADATA } from "../quest-manifest.js";

import { THE_AURA_OF_SOVEREIGNTY_CHAPTERS } from "./chapters.js";

/**
 * The Tunic of Isolation Quest Metadata
 *
 * Gain Encapsulation and Isolation from the global environment.
 */
/** @type {import("../quest-types.js").Quest} */
export const THE_AURA_OF_SOVEREIGNTY_QUEST = {
	...THE_AURA_OF_SOVEREIGNTY_METADATA,
	legacyProblem:
		"Component styles bleed into global scope, and global styles break components. Lack of isolation.",
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: "5-10 min",
	levels: "2-3 short levels",
	concepts: ["Web Components", "Shadow DOM", "Isolation"],

	// Chapter IDs
	chapterIds: ["swamp-of-scope", "hall-of-fragments"],

	// Chapter data
	chapters: THE_AURA_OF_SOVEREIGNTY_CHAPTERS,

	reward: {
		badge: "Isolated Component",
		description: "Component isolated, no CSS/JS global conflicts",
		ability: "Encapsulation and Isolation",
	},
};
