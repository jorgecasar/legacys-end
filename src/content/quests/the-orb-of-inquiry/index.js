import { msg } from "@lit/localize";
import { getOrbOfInquiryMetadata } from "../quest-manifest.js";

import { getOrbOfInquiryChapters } from "./chapters.js";

export const getOrbOfInquiryQuest = () => ({
	...getOrbOfInquiryMetadata(),
	legacyProblem: msg(
		"Tight coupling to concrete implementations, making testing and flexibility impossible.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("20-25 min"),
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
	chapters: getOrbOfInquiryChapters(),
	reward: {
		badge: msg("Backend Agnostic"),
		description: msg("100% backend-agnostic and testable component"),
		ability: msg("Logical Independence"),
	},
});

// No static exports here to ensure reactivity via functions.
