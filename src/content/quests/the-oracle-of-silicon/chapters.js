import { msg } from "@lit/localize";

/**
 * The Oracle of Silicon Quest Chapters
 */

/**
 * @typedef {import("../quest-types.js").LevelConfig} LevelConfig
 */

/** @returns {Record<string, LevelConfig>} */
export const getOracleOfSiliconChapters = () => ({
	"deaf-ear": {
		id: "deaf-ear",
		title: msg("The Deaf Ear"),
		description: msg("Fix a browser permission error blocking the microphone."),
		problemTitle: msg("The Muted Prophet"),
		problemDesc: msg(
			"The Oracle cannot hear your pleas because the gates of the browser are locked tight. You must unlock the voice channel.",
		),
		solutionTitle: msg("Voice Channel Open"),
		solutionDesc: msg(
			"You've successfully requested and handled microphone permissions, allowing the Oracle to hear the intent behind the whispers.",
		),
		startPos: { x: 50, y: 50 },
		npc: {
			name: msg("The Echo"),
			image: "/assets/the-oracle-of-silicon/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Voice Harmonizer"),
			image: "/assets/the-oracle-of-silicon/reward.png",
			position: { x: 40, y: 40 },
		},
	},
	"the-parrot": {
		id: "the-parrot",
		title: msg("The Parrot"),
		description: msg("Implement speech synthesis to make the game talk back."),
		problemTitle: msg("Silent Echoes"),
		problemDesc: msg(
			"The Oracle processes truth but remains silent. Give the digital construct a voice to speak the truths it finds.",
		),
		solutionTitle: msg("Digital Voice Acquired"),
		solutionDesc: msg(
			"Using the Web Speech API, the Oracle now speaks back, guiding you through the silicon trails.",
		),
		startPos: { x: 50, y: 50 },
		npc: {
			name: msg("The Echo"),
			image: "/assets/the-oracle-of-silicon/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Silver Tongue"),
			image: "/assets/the-oracle-of-silicon/reward.png",
			position: { x: 40, y: 40 },
		},
	},
	"babel-fish": {
		id: "babel-fish",
		title: msg("The Babel Fish"),
		description: msg(
			"Use the AI Prompt API to translate user commands into game actions.",
		),
		problemTitle: msg("Lost in Translation"),
		problemDesc: msg(
			"The Oracle hears 'Let's bounce' but doesn't know you mean 'return to hub'. Use the Prompt API to bridge the gap.",
		),
		solutionTitle: msg("Intent Deciphered"),
		solutionDesc: msg(
			"You've integrated Gemini Nano to parse natural language into actionable game commands.",
		),
		startPos: { x: 50, y: 50 },
		npc: {
			name: msg("The Echo"),
			image: "/assets/the-oracle-of-silicon/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Intent Weaver"),
			image: "/assets/the-oracle-of-silicon/reward.png",
			position: { x: 40, y: 40 },
		},
	},
	"context-key": {
		id: "context-key",
		title: msg("The Context Key"),
		description: msg(
			"Inject game context into the AI prompt for smarter responses.",
		),
		problemTitle: msg("Blind Oracle"),
		problemDesc: msg(
			"The AI doesn't know where you are or what you're holding. Inject the GameContext so it can understand 'Open this'.",
		),
		solutionTitle: msg("Contextual Awareness"),
		solutionDesc: msg(
			"By providing environmental data to the Prompt API, the Oracle can now make informed decisions based on the game's state.",
		),
		startPos: { x: 50, y: 50 },
		npc: {
			name: msg("The Echo"),
			image: "/assets/the-oracle-of-silicon/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Oracle's Sight"),
			image: "/assets/the-oracle-of-silicon/reward.png",
			position: { x: 40, y: 40 },
		},
	},
	"hallucination-shield": {
		id: "hallucination-shield",
		title: msg("The Hallucination"),
		description: msg("Handle AI errors and invalid JSON responses gracefully."),
		problemTitle: msg("The Shattered Logic"),
		problemDesc: msg(
			"The Oracle sometimes speaks in riddles that break the game's logic. Build a shield to catch invalid responses.",
		),
		solutionTitle: msg("Logic Refined"),
		solutionDesc: msg(
			"You've implemented robust error handling and response validation for the AI's output.",
		),
		startPos: { x: 50, y: 50 },
		npc: {
			name: msg("The Echo"),
			image: "/assets/the-oracle-of-silicon/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Truth Seeker"),
			image: "/assets/the-oracle-of-silicon/reward.png",
			position: { x: 40, y: 40 },
		},
	},
});

/** @deprecated Use getOracleOfSiliconChapters() instead */
export const THE_ORACLE_OF_SILICON_CHAPTERS = getOracleOfSiliconChapters();
