import { msg } from "@lit/localize";
import { getOracleOfSiliconMetadata } from "../quest-manifest.js";
import { getOracleOfSiliconChapters } from "./chapters.js";

/**
 * The Oracle of Silicon Quest Metadata
 *
 * Use Built-in AI to interact with the world through intent and speech.
 *
 * @returns {import("../quest-types.js").Quest}
 */
export const getOracleOfSiliconQuest = () => ({
	...getOracleOfSiliconMetadata(),
	legacyProblem: msg(
		"Rigid 'if/else' command matching that fails on natural language. Lack of accessibility through voice.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("15-20 min"),
	levels: "5 intent-driven levels",
	concepts: [
		msg("Built-in AI"),
		msg("Prompt API"),
		msg("Web Speech API"),
		msg("Intent Parsing"),
	],

	// Chapter IDs
	chapterIds: [
		"deaf-ear",
		"the-parrot",
		"babel-fish",
		"context-key",
		"hallucination-shield",
	],

	// Chapter data
	chapters: getOracleOfSiliconChapters(),

	reward: {
		badge: msg("Silver Tongue"),
		description: msg(
			"Ability to control the game via natural language and voice",
		),
		ability: msg("Command Override"),
	},
});

// No static exports here to ensure reactivity via functions.
