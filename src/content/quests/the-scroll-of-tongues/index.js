import { msg } from "@lit/localize";
import { getScrollOfTonguesMetadata } from "../quest-manifest.js";
import { getScrollOfTonguesChapters } from "./chapters.js";

/** @returns {import("../quest-types.js").Quest} */
export const getScrollOfTonguesQuest = () => ({
	...getScrollOfTonguesMetadata(),
	legacyProblem: msg(
		"Hardcoded strings, date/number format issues across regions, lack of localization.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("25-35 min"),
	concepts: [
		msg("i18n Context"),
		msg("Locale Management"),
		msg("Contextual Formatting"),
		msg("String Management"),
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: getScrollOfTonguesChapters(),
	reward: {
		badge: msg("Polyglot Master"),
		description: msg("Globally accessible component, adapted to any culture"),
		ability: msg("Total Globalization"),
	},
});

// No static exports here to ensure reactivity via functions.
