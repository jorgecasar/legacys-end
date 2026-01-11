import { Difficulty } from "../quest-types.js";
import { THE_ACCESSIBILITY_ECHOES_CHAPTERS } from "./chapters.js";

/**
 * The Accessibility Echoes Quest Metadata
 *
 * Teaches A11y, ARIA, and Focus Management.
 */
/** @type {import("../quest-types.js").Quest} */
export const THE_ACCESSIBILITY_ECHOES_QUEST = {
	id: "the-accessibility-echoes",
	name: "The Accessibility Echoes",
	subtitle: "Navigating the Invisible Realm",
	description:
		"A magical fog has blinded the realm. Your eyes are useless here. You must learn to navigate the world using the Echoes (ARIA), guiding those who perceive the code differently safely through the interface. **Accessibility is not optional**.",
	legacyProblem:
		"Inaccessible application, keyboard traps, lack of screen reader support.",
	prerequisites: ["the-aura-of-sovereignty"],
	shortcuts: [],
	difficulty: Difficulty.INTERMEDIATE,
	icon: "eye-off",
	estimatedTime: "25-35 min",
	concepts: [
		"ARIA Live Regions",
		"Focus Management",
		"Semantic HTML",
		"Screen Readers",
		"Keyboard Navigation",
	],

	// Chapter IDs
	chapterIds: ["fog-of-silence", "echo-chamber"],

	// Chapter data
	chapters: THE_ACCESSIBILITY_ECHOES_CHAPTERS,

	reward: {
		badge: "Blindseer's Lens",
		description: "An accessible component, usable by all",
		ability: "Universal Perception",
	},
	status: "coming-soon",
};
