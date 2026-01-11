import { Difficulty } from "../quest-types.js";
import { THE_ORB_OF_INQUIRY_CHAPTERS } from "./chapters.js";

export const THE_ORB_OF_INQUIRY_QUEST = {
	id: "the-orb-of-inquiry",
	name: "The Orb of Inquiry",
	subtitle: "Mastering the Art of Dependency Injection",
	description:
		"Alarion discovers that a hero bound to their tools is a prisoner. To free your potential, you must cut the hard ties with the outside world and learn to summon services through the Ether of Context. Master Inversion of Control.",
	legacyProblem:
		"Tight coupling to concrete implementations, making testing and flexibility impossible.",
	prerequisites: ["the-aura-of-sovereignty"],
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.INTERMEDIATE,
	icon: "plug",
	estimatedTime: "20-25 min",
	concepts: [
		"DIP",
		"IoC",
		"Service Interfaces",
		"Context API",
		"@provide",
		"@consume",
		"Hot Switch",
	],
	chapterIds: [
		"hall-of-definition",
		"temple-of-inversion",
		"the-jewelers-workshop",
		"assay-chamber",
		"liberated-battlefield",
	],
	// Chapter data
	chapters: THE_ORB_OF_INQUIRY_CHAPTERS,
	reward: {
		badge: "Backend Agnostic",
		description: "100% backend-agnostic and testable component",
		ability: "Logical Independence",
	},
	status: "available",
};
