import { msg } from "@lit/localize";
import { getAuraOfSovereigntyMetadata } from "../quest-manifest.js";

import { getAuraOfSovereigntyChapters } from "./chapters.js";

/**
 * The Tunic of Isolation Quest Metadata
 *
 * Gain Encapsulation and Isolation from the global environment.
 */
export const getAuraOfSovereigntyQuest = () => ({
	...getAuraOfSovereigntyMetadata(),
	legacyProblem: msg(
		"Component styles bleed into global scope, and global styles break components. Lack of isolation.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("5-10 min"),
	levels: msg("2-3 short levels"),
	concepts: [msg("Web Components"), msg("Shadow DOM"), msg("Isolation")],

	// Chapter IDs
	chapterIds: ["swamp-of-scope", "hall-of-fragments"],

	// Chapter data
	chapters: getAuraOfSovereigntyChapters(),

	reward: {
		badge: msg("Isolated Component"),
		description: msg("Component isolated, no CSS/JS global conflicts"),
		ability: msg("Encapsulation and Isolation"),
	},
});

// No static exports here to ensure reactivity via functions.
