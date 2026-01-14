import { msg } from "@lit/localize";
import { getScryingPoolOfChaosMetadata } from "../quest-manifest.js";
import { getCrimsonAltarChapters } from "./chapters.js";

/** @returns {import("../quest-types.js").Quest} */
export const getScryingPoolOfChaosQuest = () => ({
	...getScryingPoolOfChaosMetadata(),
	legacyProblem: msg(
		"Unhandled errors crash the app, silent failures, lack of visibility into issues.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("35-45 min"),
	concepts: [
		msg("Centralized Error Handling"),
		msg("Logging"),
		msg("Observability Patterns"),
		msg("Boundary Error Components"),
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: getCrimsonAltarChapters(),
	reward: {
		badge: msg("Chaos Warden"),
		description: msg("Resilient application with full error observability"),
		ability: msg("Centralized Monitoring"),
	},
});

// No static exports here to ensure reactivity via functions.
