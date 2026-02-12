#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { writeGitHubOutput } from "./ai-config.js";
import { runWithFallback } from "./gemini-with-fallback.js";

const DEVELOP_SCHEMA = {
	type: "OBJECT",
	description: "A set of file changes to solve a technical task.",
	properties: {
		changes: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					path: {
						type: "STRING",
						description: "Relative path from the project root.",
					},
					operation: {
						type: "STRING",
						enum: ["write", "create", "delete"],
						description: "The file action to perform.",
					},
					content: {
						type: "STRING",
						description: "Full content of the file (for create/write).",
					},
				},
				required: ["path", "operation"],
			},
		},
	},
	required: ["changes"],
};

const DEVELOP_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your task is to implement the technical plan for a given issue.

Output Requirements:
- Return a JSON object with a 'changes' array.
- Each change must have 'path', 'operation', and 'content'.
- Avoid boilerplate comments; provide complete, functional code.
- Ensure all paths are relative to the project root.`;

const DEVELOP_PROMPT = `Implement solutions for:
Issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}

Methodology provided by Planning phase:
{{METHODOLOGY}}

Context of relevant files:
{{FILES}}`;

export async function implementPlan() {
	const issueNumber = process.env.ISSUE_NUMBER;
	const title = process.env.ISSUE_TITLE;
	const methodology = process.env.METHODOLOGY;
	const files = process.env.FILES;

	if (!issueNumber || !title) {
		console.error(
			"Missing required environment variables (ISSUE_NUMBER, ISSUE_TITLE).",
		);
		process.exit(1);
	}

	// Read files content to provide context
	let filesContext = "";
	if (files && files !== "None") {
		const fileList = files.split(/\s+/).filter(Boolean);
		for (const f of fileList) {
			if (fs.existsSync(f)) {
				const stats = fs.statSync(f);
				if (stats.isFile()) {
					const content = fs.readFileSync(f, "utf8");
					filesContext += `\n--- FILE: ${f} ---\n${content}\n`;
				}
			}
		}
	}

	const prompt = DEVELOP_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{METHODOLOGY}}", methodology || "TDD")
		.replace("{{FILES}}", filesContext || "None");

	try {
		console.log(
			`>>> Generating structured implementation for issue #${issueNumber}...`,
		);
		const result = await runWithFallback("pro", prompt, {
			systemInstruction: DEVELOP_SYSTEM_INSTRUCTION,
			responseSchema: DEVELOP_SCHEMA,
		});

		const data = result.data;

		if (!data || !data.changes || !Array.isArray(data.changes)) {
			console.error("Debug - Data received:", JSON.stringify(data, null, 2));
			throw new Error("Invalid structure: missing changes array.");
		}

		console.log(`Applying ${data.changes.length} changes...`);

		for (const change of data.changes) {
			const fullPath = path.resolve(process.cwd(), change.path);
			console.log(`- ${change.operation}: ${change.path}`);

			// Ensure directory exists
			fs.mkdirSync(path.dirname(fullPath), { recursive: true });

			if (change.operation === "write" || change.operation === "create") {
				fs.writeFileSync(fullPath, change.content || "", "utf8");
			} else if (change.operation === "delete") {
				if (fs.existsSync(fullPath)) {
					fs.unlinkSync(fullPath);
				}
			}
		}

		writeGitHubOutput("input_tokens", result.inputTokens);
		writeGitHubOutput("output_tokens", result.outputTokens);

		console.log("✅ Implementation phase complete.");
		return result;
	} catch (error) {
		console.error("❌ Development Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
	}
}

import { fileURLToPath } from "node:url";

if (import.meta.url === fileURLToPath(import.meta.url)) {
	implementPlan().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
