import { Difficulty, QuestType } from "../quest-types.js";


export const THE_MIRROR_OF_VERACITY_QUEST = {
	id: "the-mirror-of-veracity",
	name: "The Mirror of Veracity",
	subtitle: "Build the Ultimate Anti-Regression Shield",
	type: QuestType.QUEST,
	description:
		"Dominate the art of Verification. Create a defense system against regressions and future bugs using the Mirror of Veracity.",
	legacyProblem:
		"Code is fragile, prone to regression bugs, and lacks automated verification.",
	prerequisites: ["the-orb-of-inquiry"],
	shortcuts: [],
	difficulty: Difficulty.ADVANCED,
	icon: "search",
	estimatedTime: "30-40 min",
	concepts: [
		"Testing Pyramid",
		"Unit Testing",
		"Integration Testing",
		"Mocking",
		"TDD",
	],
	chapterIds: [],
	// Chapter data
	loadChapters: async () => {
		const { THE_MIRROR_OF_VERACITY_CHAPTERS } = await import("./chapters.js");
		return THE_MIRROR_OF_VERACITY_CHAPTERS;
	},
	reward: {
		badge: "Truth Seeker",
		description: "A shielded component, verified and resistant to regressions",
		ability: "Automated Verification",
	},
	status: "coming-soon",
};
