import { Difficulty } from "../quest-types.js";
import { GATE_OF_IDENTITY_CHAPTERS } from "./chapters.js";

export const GATE_OF_IDENTITY_QUEST = {
	id: "the-watchers-bastion",
	name: "The Watcher's Bastion",
	subtitle: "Architecting the Fortress of Identity",
	description:
		"The enemy tries to slip through the cracks of navigation. It is not enough to ask 'who goes there?' at every door. You must erect an intelligent perimeter wall that reacts to intruders before they take a single step. Centralize your security logic.",
	legacyProblem:
		"Scattered authentication logic, repetitive `isLoggedIn()` checks, and vulnerable redirection flows.",
	prerequisites: ["the-orb-of-inquiry"],
	shortcuts: /** @type {string[]} */ ([]),
	difficulty: Difficulty.ADVANCED,
	icon: "shield",
	color: "#ef4444",
	estimatedTime: "30-40 min",
	levels: "4-5 levels",
	concepts: [
		"Auth Guards",
		"User Context",
		"Centralized Session Management",
		"Frontend Perimeter Security",
		"Route Protection",
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: GATE_OF_IDENTITY_CHAPTERS,
	reward: {
		badge: "Security Sentinel Badge",
		description:
			"Application with protected routes, reactive and centrally managed user identity.",
		ability: "Master of Centralized Security",
	},
	status: "coming-soon",
};
