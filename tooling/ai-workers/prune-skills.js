#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");
const DEFAULT_SKILLS_DIR = path.join(ROOT, ".gemini/skills");

const PHASES = {
	planning: [
		"project-context",
		"task-creator",
		"agentic-design-patterns",
		"github-ops",
		"rulesync",
	],
	development: [
		"project-context",
		"lit-component",
		"git-flow",
		"conventional-commits",
		"webawesome",
		"coverage-evolution",
		"skill-mutation-testing",
		"rulesync",
		"typing",
	],
};

/**
 * Prune skills based on the execution phase.
 * @param {string} phase - The phase to runs (planning | development)
 * @param {Object} [deps] - Dependencies for testing
 */
export function prune(phase, deps = {}) {
	const {
		fs: fsMod = fs,
		path: pathMod = path,
		skillsDir = DEFAULT_SKILLS_DIR,
		console: consoleMod = console,
		process: processMod = process,
	} = deps;

	if (!PHASES[phase]) {
		consoleMod.error(
			`Unknown phase: ${phase}. Available: ${Object.keys(PHASES).join(", ")}`,
		);
		if (processMod.env.NODE_ENV !== "test") processMod.exit(1);
		return;
	}

	if (!fsMod.existsSync(skillsDir)) {
		consoleMod.log("Skipping: .gemini/skills directory not found.");
		return;
	}

	const keepList = PHASES[phase];
	let allSkills;
	try {
		allSkills = fsMod.readdirSync(skillsDir);
	} catch (error) {
		consoleMod.error(`Error reading skills directory: ${error.message}`);
		return;
	}

	consoleMod.log(`>>> Pruning skills for [${phase}] phase...`);

	for (const skill of allSkills) {
		if (!keepList.includes(skill)) {
			const skillPath = pathMod.join(skillsDir, skill);
			consoleMod.log(`- Removing: ${skill}`);
			try {
				fsMod.rmSync(skillPath, { recursive: true, force: true });
			} catch (error) {
				consoleMod.error(`Failed to remove ${skill}: ${error.message}`);
			}
		}
	}

	consoleMod.log("✅ Pruning complete.");
}

const arg = process.argv[2];
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	if (!arg) {
		console.error("Usage: node prune-skills.js [planning|development]");
		process.exit(1);
	}
	prune(arg);
}
