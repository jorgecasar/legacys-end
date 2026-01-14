import { msg } from "@lit/localize";
import { getTokenOfAgnosticismMetadata } from "../quest-manifest.js";
import { getChromaticLoomChapters } from "./chapters.js";

/**
 * The Token of Agnosticism Quest Metadata
 *
 * Teaches Design Tokens and visual adaptation
 *
 * @returns {import("../quest-types.js").Quest}
 */
export const getChromaticLoomQuest = () => ({
	...getTokenOfAgnosticismMetadata(),
	legacyProblem: msg(
		"Hardcoded styles, inability to adapt to Dark Mode or different branding requirements.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("20-30 min"),
	concepts: [
		msg("Design Tokens"),
		msg("CSS Custom Properties"),
		msg("Programmatic Theming"),
	],

	// Chapter IDs
	chapterIds: ["fortress-of-design"],

	// Chapter data
	chapters: getChromaticLoomChapters(),

	reward: {
		badge: msg("Visually Agnostic"),
		description: msg("Visually agnostic and adaptable component"),
		ability: msg("Visual Adaptation"),
	},
});

// No static exports here to ensure reactivity via functions.
