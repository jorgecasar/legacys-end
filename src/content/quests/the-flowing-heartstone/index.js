import { msg } from "@lit/localize";
import { getStateManagementRaidMetadata } from "../quest-manifest.js";

import { getTheFlowingHeartstoneChapters } from "./chapters.js";

export const getStateManagementRaidQuest = () => ({
	...getStateManagementRaidMetadata(),
	legacyProblem: msg(
		"Massive re-rendering of entire components when a single localized data point changes.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	concepts: [
		"Signals",
		"Signal.State",
		"Signal.Computed",
		"Signal.subtle.Watcher",
		"DAG (Directed Acyclic Graph)",
		"Push/Pull Algorithm",
		"Fine-grained Reactivity",
		"Store Governance",
	],
	chapterIds: [
		"the-pressure-sensor",
		"the-turn-automator",
		"the-fiber-optic-cable",
		"the-ambulance-hub",
		"the-fuse-box",
	],
	// Chapter data
	chapters: getTheFlowingHeartstoneChapters(),
	reward: {
		badge: msg("Surgical Reactivity"),
		description: msg(
			"Mastery over fine-grained reactive state without VDOM rendering overhead.",
		),
		ability: msg("Glitch-Free State Flow"),
	},
});
