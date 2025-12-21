import { Difficulty, QuestType } from "../quest-types.js";

/**
 * The Tunic of Isolation Quest Metadata
 *
 * Gain Encapsulation and Isolation from the global environment.
 */
export const THE_AURA_OF_SOVEREIGNTY_QUEST = {
	id: "the-aura-of-sovereignty",
	name: "The Aura of Sovereignty",
	subtitle: "Encapsulate Your Code",
	type: QuestType.QUEST,
	description:
		"Before Alarion can connect with others, he must learn to exist without being corrupted by them. In the Toxic Swamp of Global Scope, he must find an umbrella to protect his styles and DOM from the chaotic environment.",
	legacyProblem: "Component is coupled to global DOM and external scripts.",
	prerequisites: [],
	shortcuts: [],
	difficulty: Difficulty.BEGINNER,
	icon: "shield",
	estimatedTime: "5-10 min",
	levels: "2-3 short levels",
	concepts: ["Web Components", "Shadow DOM", "Isolation"],

	// Chapter IDs
	chapterIds: ["swamp-of-scope", "hall-of-fragments"],

	// Chapter data (Lazy Loaded)
	loadChapters: async () => {
		const module = await import("./chapters.js");
		return module.THE_AURA_OF_SOVEREIGNTY_CHAPTERS;
	},

	reward: {
		badge: "Isolated Component",
		description: "Component isolated, no CSS/JS global conflicts",
		ability: "Encapsulation and Isolation",
	},
	status: "available",
};
