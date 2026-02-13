#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { writeGitHubOutput } from "../config/index.js";
import { runWithFallback } from "../gemini/index.js";

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
		commit_message: {
			type: "STRING",
			description:
				"A concise Conventional Commit message (e.g., 'feat(user): add login logic') describing the changes.",
		},
	},
	required: ["changes", "commit_message"],
};

const DEVELOP_SYSTEM_INSTRUCTION = `You are a Developer Agent. Your task is to implement the technical plan for a given issue.

Output Requirements:
- Return a JSON object with a 'changes' array and a 'commit_message'.
- Each change must have 'path', 'operation', and 'content'.
- Avoid boilerplate comments; provide complete, functional code.
- Ensure all paths are relative to the project root.
- The 'commit_message' MUST follow Conventional Commits (type(scope): description) and be specific to the implementation details.`;

const DEVELOP_PROMPT = `Implement solutions for:
Issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}
Body:
{{BODY}}

Methodology provided by Planning phase:
{{METHODOLOGY}}

The plan requires creating or modifying the following files:
{{FILE_LIST}}

Here is the current content of those files (if they exist):
{{FILES_CONTENT}}`;

export async function implementPlan() {
	const issueNumber = process.env.ISSUE_NUMBER;
	const title = process.env.ISSUE_TITLE;
	const body = process.env.ISSUE_BODY;
	const methodology = process.env.METHODOLOGY;
	const files = process.env.FILES;

	if (!issueNumber || !title) {
		console.error(
			"Missing required environment variables (ISSUE_NUMBER, ISSUE_TITLE).",
		);
		process.exit(1);
	}

	const fileList = files ? files.split(/\s+/).filter(Boolean) : [];
	let filesContent = "";
	if (fileList.length > 0) {
		for (const f of fileList) {
			if (fs.existsSync(f)) {
				const stats = fs.statSync(f);
				if (stats.isFile()) {
					const content = fs.readFileSync(f, "utf8");
					filesContent += `\n--- FILE: ${f} ---\n${content}\n`;
				}
			}
		}
	}

	const prompt = DEVELOP_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{BODY}}", body || "")
		.replace("{{METHODOLOGY}}", methodology || "TDD")
		.replace("{{FILE_LIST}}", fileList.join("\n") || "None")
		.replace("{{FILES_CONTENT}}", filesContent || "None");

	let result;
	try {
		console.log(
			`>>> Generating structured implementation for issue #${issueNumber}...`,
		);
		result = await runWithFallback("pro", prompt, {
			systemInstruction: DEVELOP_SYSTEM_INSTRUCTION,
			responseSchema: DEVELOP_SCHEMA,
		});

		console.log(
			">>> Raw response from Developer Agent:",
			JSON.stringify(result.data, null, 2),
		);

		// Write tokens immediately so they aren't lost if later steps fail
		writeGitHubOutput(
			"input_tokens",
			result.input_tokens || result.inputTokens,
		);
		writeGitHubOutput(
			"output_tokens",
			result.output_tokens || result.outputTokens,
		);
	} catch (error) {
		console.error("❌ Development LLM Error:", error.message);
		if (process.env.NODE_ENV !== "test") process.exit(1);
		return;
	}

	try {
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

		// Output commit message for the workflow
		const commitMessage =
			data.commit_message || `feat(ai): implementation of #${issueNumber}`;
		writeGitHubOutput("commit_message", commitMessage);
		console.log(`Commit message generated: "${commitMessage}"`);

		console.log("✅ Implementation phase complete.");
		return result;
	} catch (error) {
		console.error("❌ Development Post-Processing Error:", error.message);
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
