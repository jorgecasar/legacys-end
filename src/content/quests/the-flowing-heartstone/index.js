import { msg } from "@lit/localize";
import { getStateManagementRaidMetadata } from "../quest-manifest.js";
import { getFlowingHeartstoneChapters } from "./chapters.js";

/** @returns {import("../quest-types.js").Quest} */
export const getStateManagementRaidQuest = () => ({
	...getStateManagementRaidMetadata(),
	legacyProblem: msg(
		"Prop drilling, unpredictable global state mutation, and excessive re-renders due to poor reactivity.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("30-40 min"),
	concepts: [
		msg("Reactive Patterns"),
		msg("Signals"),
		msg("Observable Stores"),
		msg("Context API (for Stores)"),
		msg("Unidirectional Data Flow"),
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: getFlowingHeartstoneChapters(),
	reward: {
		badge: msg("State Master"),
		description: msg("Reactive, predictable component without prop drilling"),
		ability: msg("State Predictability"),
	},
});

// No static exports here to ensure reactivity via functions.
