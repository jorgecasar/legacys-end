import fs from "node:fs";

/**
 * AI Configuration Constants
 *
 * Centralizes GitHub Project IDs, Field IDs, and Common Settings.
 */

export const PROJECT_ID = "PVT_kwHOAA562c4BOtC-";
export const OWNER = "jorgecasar";
export const REPO = "legacys-end";

export const FIELD_IDS = {
	status: "PVTSSF_lAHOAA562c4BOtC-zg9U7KE",
	priority: "PVTSSF_lAHOAA562c4BOtC-zg9U7SY",
	model: "PVTF_lAHOAA562c4BOtC-zg9g9xk", // Text field
	cost: "PVTF_lAHOAA562c4BOtC-zg9hBOw", // Number field
};

export const OPTION_IDS = {
	status: {
		todo: "f75ad846",
		inProgress: "47fc9ee4",
		paused: "8842b2d9",
	},
	priority: {
		p0: "330b32fb",
		p1: "f692bf94",
		p2: "6b58477b",
	},
};

/**
 * Write to GitHub Actions output if available
 */
export function writeGitHubOutput(key, value) {
	if (process.env.GITHUB_OUTPUT) {
		fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
	}
}
