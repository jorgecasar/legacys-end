import { msg } from "@lit/localize";
/**
 * The Tunic of Isolation Quest - Chapter Data
 *
 * This quest teaches the basics of Web Components:
 * - cb-1: Encapsulation (Shadow DOM, Custom Elements)
 */

/**
 * @typedef {import("../quest-types.js").LevelConfig} LevelConfig
 */

/** @returns {Record<string, LevelConfig>} */
export const getZeroOneChapters = () => ({
	/** * CAPÍTULO 1: El Suelo Primordial (The Loading Program)
	 * Temática: Contexto (RAG) y Estabilidad de la IA.
	 * Estética: Matrix "White Room".
	 */

	"the-construct": {
		id: "the-construct",
		title: msg("The Construct"),
		description: msg(
			"Welcome to the Construct. This is our loading program. Here, reality is only what we inject. If you don’t define all you want to create, the system will hallucinate it... and I assure you, you don't want to fall into a hallucination.",
		),

		architecturalChanges: [
			msg("Requirements: PRD as Ground Truth."),
			msg("Architecture: Context Codexes for standards."),
			msg("Testing: Automated verification for DoD."),
		],
		backgroundStyle: `url('/assets/the-construct/background.png')`,
		backgroundStyleReward: `url('/assets/the-construct/background_reward.png')`,
		startPos: { x: 60, y: 60 },

		npc: {
			name: msg("Morpheus"),
			image: "/assets/the-construct/npc.png",
			position: { x: 45, y: 60 },
		},

		reward: {
			name: msg("Red Pill"),
			image: "/assets/the-construct/reward.png",
			position: { x: 50, y: 55 },
		},

		hero: {
			image: "/assets/the-construct/hero.png",
		},

		exitZone: {
			x: 50,
			y: 90,
			width: 10,
			height: 20,
			label: msg("Architect's Chamber"),
		},
	},

	/**
	 * CAPÍTULO 2: La Cámara del Arquitecto (The Architect's Chamber)
	 * Temática: Control, Vigilancia y Validación (Human in the Loop)
	 */
	"the-architect": {
		id: "the-architect",
		title: msg("The Architect's Chamber"),
		description: msg(
			"Alarion reaches the core: The Source. Here, The Architect maintains the master algorithm. 'You have learned to create and to orchestrate,' the Architect says. 'But true power lies in the oversight. An architect does not just build; they ensure that every block, every agent, and every line of code aligns with the master purpose.'",
		),
		architecturalChanges: [
			msg("Validation: Human feedback loop for alignment."),
			msg("Monitoring: Oversight of autonomous processes."),
			msg("Alignment: Ensuring output matches intent."),
		],
		stats: { maintainability: 30, portability: 30 },
		backgroundStyle: `url('/assets/the-architect/background.png')`,
		startPos: { x: 10, y: 85 },
		npc: {
			name: msg("The Architect"),
			image: "/assets/the-architect/npc.png",
			position: { x: 85, y: 85 },
			icon: "account_balance",
		},
		reward: {
			name: msg("Source Code Vision"),
			image: "/assets/the-architect/reward.png",
			position: { x: 50, y: 75 },
		},
		hero: { image: "/assets/the-architect/hero.png" },
		exitZone: {
			x: 90,
			y: 90,
			width: 10,
			height: 20,
			label: msg("Reboot World"),
		},
		obstacles: [],
	},
});
