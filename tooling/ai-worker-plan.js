#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeGitHubOutput } from "./ai-config.js";
import { runWithFallback } from "./gemini-with-fallback.js";

const PLAN_SCHEMA = {
	type: "OBJECT",
	description: "A technical plan for solving a specific GitHub issue.",
	properties: {
		methodology: {
			type: "STRING",
			description: "The technical approach or steps (e.g., TDD).",
		},
		slug: {
			type: "STRING",
			description: "URL-friendly branch identifier.",
		},
		files_to_touch: {
			type: "ARRAY",
			items: { type: "STRING" },
			description: "List of files that will be created or modified.",
		},
		sub_tasks: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					title: { type: "STRING", description: "Concise sub-task title." },
					goal: {
						type: "STRING",
						description: "Detailed goal of the sub-task.",
					},
				},
				required: ["title", "goal"],
			},
			description: "Optional decomposition into smaller sub-issues.",
		},
		needs_decomposition: {
			type: "BOOLEAN",
			description: "True if the task is complex enough to be split.",
		},
	},
	required: ["methodology", "slug", "files_to_touch", "needs_decomposition"],
};

const PLAN_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your goal is to create precise, execution-ready technical plans.

Output Requirements:
- Return a JSON object matching the required schema.
- methodology: Describe the TDD approach.
- slug: use kebab-case for the branch name (e.g., 'fix-auth-logic').
- files_to_touch: Mention ALL files involved.
- decomposition: Only suggest sub-tasks if the issue is high-complexity.`;

const PLAN_PROMPT = `Create a technical plan for:
Issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}
Body:
{{BODY}}`;

export async function createTechnicalPlan({
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
			systemInstruction: PLAN_SYSTEM_INSTRUCTION,
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
				const title = (sub.title || "").replace(/["$`]/g, "\\$&");
				const goal = (sub.goal || "").replace(/["$`]/g, "\\$&");
				const createCmd = `gh issue create --title "${title}" --body "Sub-task of #${issueNumber}. \n\nGoal: ${goal}" --label "sub-task"`;
				console.log(`Creating sub-issue: ${title}`);
				exec(createCmd);
			}
		}

		// 3. Output for workflow
		writeGitHubOutput("methodology", plan.methodology || "TDD");
		writeGitHubOutput("files", (plan.files_to_touch || []).join(" "));
		writeGitHubOutput(
			"needs_decomposition",
			plan.needs_decomposition ? "true" : "false",
		);
		writeGitHubOutput("input_tokens", result.inputTokens);
		writeGitHubOutput("output_tokens", result.outputTokens);

		console.log("✅ Planning phase complete.");
		return result;
	} catch (error) {
		console.error("❌ Planning Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
	}
}

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	createTechnicalPlan().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
