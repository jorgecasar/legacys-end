import { msg } from "@lit/localize";
import { getUnseenHarmonyMetadata } from "../quest-manifest.js";
import { getUnseenHarmonyChapters } from "./chapters.js";

/**
 * The Unseen Harmony Quest Metadata
 *
 * Teaches A11y, ARIA, and Focus Management.
 *
 * @returns {import("../quest-types.js").Quest}
 */
export const getUnseenHarmonyQuest = () => ({
	...getUnseenHarmonyMetadata(),
	legacyProblem: msg(
		"Inaccessible application, keyboard traps, lack of screen reader support.",
	),
	shortcuts: [],
	estimatedTime: msg("25-35 min"),
	concepts: [
		msg("ARIA Live Regions"),
		msg("Focus Management"),
		msg("Semantic HTML"),
		msg("Screen Readers"),
		msg("Keyboard Navigation"),
	],

	// Chapter IDs
	chapterIds: ["fog-of-silence", "echo-chamber"],

	// Chapter data
	chapters: getUnseenHarmonyChapters(),

	reward: {
		badge: msg("Blindseer's Lens"),
		description: msg("An accessible component, usable by all"),
		ability: msg("Universal Perception"),
	},
});

// No static exports here to ensure reactivity via functions.
