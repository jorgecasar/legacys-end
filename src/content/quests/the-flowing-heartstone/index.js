import { Difficulty } from "../quest-types.js";
import { STATE_MANAGEMENT_RAID_CHAPTERS } from "./chapters.js";

export const STATE_MANAGEMENT_RAID_QUEST = {
	id: "the-flowing-heartstone",
	name: "The Flowing Heartstone",
	subtitle: "Harnessing the Power of Fine-Grained Reactivity",
	description:
		"The state of the world is volatile; a change in the north causes storms in the south. You must synchronize the world's heartbeat with **The Flowing Heartstone**, a single source of truth that pulses instantly across the realm without disturbing the sleepers.",
	legacyProblem:
		"Prop drilling, unpredictable global state mutation, and excessive re-renders due to poor reactivity.",
	prerequisites: ["the-orb-of-inquiry"],
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.ADVANCED,
	icon: "database",
	estimatedTime: "30-40 min",
	concepts: [
		"Reactive Patterns",
		"Signals",
		"Observable Stores",
		"Context API (for Stores)",
		"Unidirectional Data Flow",
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: STATE_MANAGEMENT_RAID_CHAPTERS,
	reward: {
		badge: "State Master",
		description: "Reactive, predictable component without prop drilling",
		ability: "State Predictability",
	},
	status: "coming-soon",
};
