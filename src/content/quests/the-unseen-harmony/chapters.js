import { msg } from "@lit/localize";

/**
 * @typedef {import("../quest-types.js").LevelConfig} LevelConfig
 */

/** @returns {Record<string, LevelConfig>} */
export const getUnseenHarmonyChapters = () => ({
	"fog-of-silence": {
		id: "fog-of-silence",
		title: msg("The Fog of Silence"),
		description: msg(
			"Alarion enters a thick fog where sight is useless. He must learn to navigate using inner resonance and digital echoes. Master the basics of Keyboard Navigation and ARIA Labels.",
		),
		problemTitle: msg("The Invisible Maze"),
		problemDesc: msg(
			"The interface is a maze with no signs, invisible to those who cannot see with eyes.",
		),
		solutionTitle: msg("The Guided Path"),
		solutionDesc: msg(
			"By adding semantic labels and logical focus flow, the path becomes clear even in the darkest fog.",
		),
		startPos: { x: 50, y: 15 },
		npc: {
			name: msg("The Blind Guide"),
			image: "/assets/the-unseen-harmony/npc.png",
			position: { x: 50, y: 40 },
		},
		reward: {
			name: msg("Sonar Ring"),
			image: "/assets/the-unseen-harmony/reward.png",
			position: { x: 60, y: 45 },
		},
	},
	"echo-chamber": {
		id: "echo-chamber",
		title: msg("The Echo Chamber"),
		description: msg(
			"In the Echo Chamber, every change in the world must be announced to those listening. Learn to use ARIA Live Regions and Focus Management to harmonize the experience.",
		),
		problemTitle: msg("Silent Changes"),
		problemDesc: msg(
			"Things happen in the shadow, but the Echoes remain silent, leaving the player lost.",
		),
		solutionTitle: msg("Resonant Truth"),
		solutionDesc: msg(
			"With Live Regions, the world's pulse is heard by all, ensuring no event goes unnoticed.",
		),
		startPos: { x: 50, y: 15 },
		npc: {
			name: msg("The Blind Guide"),
			image: "/assets/the-unseen-harmony/npc.png",
			position: { x: 50, y: 40 },
		},
		reward: {
			name: msg("Vibrating Sigil"),
			image: "/assets/the-unseen-harmony/reward.png",
			position: { x: 60, y: 45 },
		},
	},
});

/** @deprecated Use getUnseenHarmonyChapters() instead */
export const THE_UNSEEN_HARMONY_CHAPTERS = getUnseenHarmonyChapters();
