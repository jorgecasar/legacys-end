import { THE_ORB_OF_INQUIRY_METADATA } from "../quest-manifest.js";

import { THE_ORB_OF_INQUIRY_CHAPTERS } from "./chapters.js";

export const THE_ORB_OF_INQUIRY_QUEST = {
	...THE_ORB_OF_INQUIRY_METADATA,
	legacyProblem:
		"Tight coupling to concrete implementations, making testing and flexibility impossible.",
	shortcuts: /** @type {string[]} */ ([]),
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
};
