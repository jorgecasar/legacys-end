import { msg } from "@lit/localize";
import { getGateOfIdentityMetadata } from "../quest-manifest.js";
import { getWatchersBastionChapters } from "./chapters.js";

/** @returns {import("../quest-types.js").Quest} */
export const getGateOfIdentityQuest = () => ({
	...getGateOfIdentityMetadata(),
	legacyProblem: msg(
		"Scattered authentication logic, repetitive `isLoggedIn()` checks, and vulnerable redirection flows.",
	),
	shortcuts: /** @type {string[]} */ ([]),
	estimatedTime: msg("30-40 min"),
	levels: msg("4-5 levels"),
	concepts: [
		msg("Auth Guards"),
		msg("User Context"),
		msg("Centralized Session Management"),
		msg("Frontend Perimeter Security"),
		msg("Route Protection"),
	],
	chapterIds: /** @type {string[]} */ ([]),
	// Chapter data
	chapters: getWatchersBastionChapters(),
	reward: {
		badge: msg("Security Sentinel Badge"),
		description: msg(
			"Application with protected routes, reactive and centrally managed user identity.",
		),
		ability: msg("Master of Centralized Security"),
	},
});

// No static exports here to ensure reactivity via functions.
