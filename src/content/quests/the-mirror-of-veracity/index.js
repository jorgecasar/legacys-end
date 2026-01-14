import { msg } from "@lit/localize";
import { Difficulty } from "../quest-types.js";
import { getMirrorOfVeracityChapters } from "./chapters.js";

/** @returns {import("../quest-types.js").Quest} */
export const getMirrorOfVeracityQuest = () => ({
	id: "the-mirror-of-veracity",
	name: msg("The Mirror of Veracity"),
	subtitle: msg("Build the Ultimate Anti-Regression Shield"),
	description: msg(
		"Dominate the art of Verification. Create a defense system against regressions and future bugs using the Mirror of Veracity.",
	),
	legacyProblem: msg(
		"Code is fragile, prone to regression bugs, and lacks automated verification.",
	),
	prerequisites: ["the-orb-of-inquiry"],
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.ADVANCED,
	icon: "search",
	estimatedTime: msg("30-40 min"),
	concepts: [
		msg("Testing Pyramid"),
		msg("Unit Testing"),
		msg("Integration Testing"),
		msg("Mocking"),
		msg("TDD"),
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: getMirrorOfVeracityChapters(),
	reward: {
		badge: msg("Truth Seeker"),
		description: msg(
			"A shielded component, verified and resistant to regressions",
		),
		ability: msg("Automated Verification"),
	},
	status: "coming-soon",
});

/** @deprecated Use getMirrorOfVeracityQuest() instead */
export const THE_MIRROR_OF_VERACITY_QUEST = getMirrorOfVeracityQuest();
