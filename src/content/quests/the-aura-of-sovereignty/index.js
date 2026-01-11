import { Difficulty } from "../quest-types.js";
import { THE_AURA_OF_SOVEREIGNTY_CHAPTERS } from "./chapters.js";

/**
 * The Tunic of Isolation Quest Metadata
 *
 * Gain Encapsulation and Isolation from the global environment.
 */
/** @type {import("../quest-types.js").Quest} */
export const THE_AURA_OF_SOVEREIGNTY_QUEST = {
	id: "the-aura-of-sovereignty",
	name: "The Aura of Sovereignty",
	subtitle: "Forging the Immutable Component Shield",
	description:
		"Before Alarion can connect with others, he must learn to exist without being corrupted by them. In the Toxic Swamp of Global Scope, he must find an umbrella to protect his styles and DOM from the chaotic environment. **Encapsulate Your Code**.",
	legacyProblem:
		"Component styles bleed into global scope, and global styles break components. Lack of isolation.",
	prerequisites: /** @type {any[]} */ ([]),
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.BEGINNER,
	icon: "shield",
	estimatedTime: "5-10 min",
	levels: "2-3 short levels",
	concepts: ["Web Components", "Shadow DOM", "Isolation"],

	// Chapter IDs
	chapterIds: ["swamp-of-scope", "hall-of-fragments"],

	// Chapter data
	chapters: THE_AURA_OF_SOVEREIGNTY_CHAPTERS,

	reward: {
		badge: "Isolated Component",
		description: "Component isolated, no CSS/JS global conflicts",
		ability: "Encapsulation and Isolation",
	},
	status: "available",
};
