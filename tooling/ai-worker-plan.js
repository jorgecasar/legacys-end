#!/usr/bin/env node
import { execSync } from "node:child_process";
import { runWithFallback } from "./gemini-with-fallback.js";

const PLAN_SCHEMA = {
	type: "object",
	properties: {
		methodology: { type: "string" },
		slug: { type: "string" },
		files_to_touch: { type: "array", items: { type: "string" } },
		sub_tasks: {
			type: "array",
			items: {
				type: "object",
				properties: {
					title: { type: "string" },
					goal: { type: "string" },
				},
				required: ["title", "goal"],
			},
		},
		needs_decomposition: { type: "boolean" },
	},
	required: ["methodology", "slug", "files_to_touch", "needs_decomposition"],
};

const PLAN_PROMPT = `You are a Developer Agent.
Goal: Create a technical plan to solve issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}
Body:
{{BODY}}

Instruction: Return a JSON object following the required schema.`;

export async function main({
	issueNumber = process.env.ISSUE_NUMBER,
	title = process.env.ISSUE_TITLE,
	body = process.env.ISSUE_BODY,
	exec = execSync,
} = {}) {
	if (!issueNumber || !title) {
		console.error(
			"Error: Missing ISSUE_NUMBER or ISSUE_TITLE environment variables.",
		);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	const prompt = PLAN_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{BODY}}", body || "");

	try {
		console.log(`>>> Generating structured plan for issue #${issueNumber}...`);
		const result = await runWithFallback("flash", prompt, {
			responseSchema: PLAN_SCHEMA,
		});

		const plan = result.data;

		if (!plan || !plan.slug) {
			console.error("Debug - Plan received:", JSON.stringify(plan, null, 2));
			throw new Error("Invalid plan structure.");
		}

		console.log(`Plan received. Methodology: ${plan.methodology}`);

		// 1. Create a task branch
		const branchName = `task/issue-${issueNumber}-${plan.slug || "work"}`;
		try {
			exec(`git checkout -b ${branchName}`);
		} catch (_) {
			exec(`git checkout ${branchName}`);
		}

		// Push the branch immediately
		try {
			exec(`git push -u origin ${branchName}`);
		} catch (err) {
			console.warn(
				`Warning: Could not push branch ${branchName}: ${err.message}`,
			);
		}

		// 2. Decompose into sub-issues if needed
		if (
			plan.sub_tasks &&
			plan.sub_tasks.length > 0 &&
			plan.needs_decomposition
		) {
			console.log("Decomposing into sub-issues...");
			for (const sub of plan.sub_tasks) {
				const createCmd = `gh issue create --title "${sub.title}" --body "Sub-task of #${issueNumber}. \n\nGoal: ${sub.goal}" --label "sub-task"`;
				exec(createCmd);
			}
		}

		// 3. Output for workflow
		if (process.env.GITHUB_OUTPUT) {
			const fs = await import("node:fs");
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`methodology=${plan.methodology || "TDD"}\n`,
			);
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`files=${(plan.files_to_touch || []).join(" ")}\n`,
			);
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`input_tokens=${result.inputTokens}\n`,
			);
			fs.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`output_tokens=${result.outputTokens}\n`,
			);
		}

		console.log("✅ Planning phase complete.");
	} catch (error) {
		console.error("❌ Planning Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
	}
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
