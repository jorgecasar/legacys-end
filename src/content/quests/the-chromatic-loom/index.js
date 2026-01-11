import { Difficulty } from "../quest-types.js";
import { THE_CHROMATIC_LOOM_CHAPTERS } from "./chapters.js";

/**
 * The Token of Agnosticism Quest Metadata
 *
 * Teaches Design Tokens and visual adaptation
 */
/** @type {import("../quest-types.js").Quest} */
export const TOKEN_OF_AGNOSTICISM_QUEST = {
	id: "the-chromatic-loom",
	name: "The Chromatic Loom",
	subtitle: "Weaving the Fabric of Universal Design",
	description:
		"A true master is not bound to a single color. In the Chromatic Loom, you will learn to weave interfaces that mutate at will, adapting to light, darkness, and the whims of any realm without changing a single line of logic.",
	legacyProblem:
		"Hardcoded styles, inability to adapt to Dark Mode or different branding requirements.",
	prerequisites: ["tunic-of-isolation"],
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.INTERMEDIATE,
	icon: "palette",
	estimatedTime: "20-30 min",
	concepts: ["Design Tokens", "CSS Custom Properties", "Programmatic Theming"],

	// Chapter IDs
	chapterIds: ["fortress-of-design"],

	// Chapter data
	chapters: THE_CHROMATIC_LOOM_CHAPTERS,

	reward: {
		badge: "Visually Agnostic",
		description: "Visually agnostic and adaptable component",
		ability: "Visual Adaptation",
	},
	status: "coming-soon",
};
