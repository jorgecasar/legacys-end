import { msg } from "@lit/localize";
import { getZeroOneMetadata } from "../quest-manifest.js";
import { getZeroOneChapters } from "./chapters.js";

/**
 * The Tunic of Isolation Quest Metadata
 *
 * Gain Encapsulation and Isolation from the global environment.
 */
export const getZeroOneQuest = () => ({
	...getZeroOneMetadata(),
	legacyProblem: msg(
		"The AI produces unstable hallucinations due to lack of constraints. Logic drifts and global noise corrupts the system's output.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	levels: msg("5 Recursive Chambers"), // Reflejando los 5 capítulos que planeamos
	concepts: [
		msg("Context Injection (RAG)"),
		msg("System Prompts (Identity & Rules)"),
		msg("Multi-Agent Orchestration"),
		msg("Tool Calling & Reflexion (RCI)"),
		msg("Alignment via RLHF"),
	],

	// Chapter IDs (Basados en nuestra progresión de Matrix/Zero One)
	chapterIds: Object.keys(getZeroOneChapters()),

	// Chapter data
	chapters: getZeroOneChapters(),

	reward: {
		badge: msg("Architect of Zero One"),
		description: msg(
			"Mastered the synthesis between human intent and machine execution.",
		),
		ability: msg("Agentic Intent Manifestation"),
	},
});

// No static exports here to ensure reactivity via functions.
