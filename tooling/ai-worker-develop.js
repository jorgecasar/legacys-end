#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { runWithFallback } from "./gemini-with-fallback.js";

const DEVELOP_SCHEMA = {
	type: "OBJECT",
	properties: {
		changes: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					path: { type: "STRING" },
					operation: { type: "STRING", enum: ["write", "create", "delete"] },
					content: { type: "STRING" },
				},
				required: ["path", "operation"],
			},
		},
	},
	required: ["changes"],
};

const DEVELOP_PROMPT = `You are the Developer Agent (Implementing Mode).
Task: Solve issue #{{ISSUE_NUMBER}}
Title: {{TITLE}}

Methodology: {{METHODOLOGY}}
Current Files: {{FILES}}

Instruction: Return a JSON object following the required schema with all changes needed to solve the task.`;

async function main() {
	const issueNumber = process.env.ISSUE_NUMBER;
	const title = process.env.ISSUE_TITLE;
	const methodology = process.env.METHODOLOGY;
	const files = process.env.FILES;

	if (!issueNumber || !title) {
		console.error("Missing required environment variables.");
		process.exit(1);
	}

	const prompt = DEVELOP_PROMPT.replace("{{ISSUE_NUMBER}}", issueNumber)
		.replace("{{TITLE}}", title)
		.replace("{{METHODOLOGY}}", methodology || "TDD")
		.replace("{{FILES}}", files || "None");

	try {
		console.log(
			`>>> Generating structured implementation for issue #${issueNumber}...`,
		);
		const result = await runWithFallback("pro", prompt, {
			responseSchema: DEVELOP_SCHEMA,
		});

		const data = result.data;

		if (!data.changes || !Array.isArray(data.changes)) {
			throw new Error("Invalid structure: missing changes array.");
		}

		console.log(`Applying ${data.changes.length} changes...`);

		for (const change of data.changes) {
			const fullPath = path.resolve(process.cwd(), change.path);
			console.log(`- ${change.operation}: ${change.path}`);

			fs.mkdirSync(path.dirname(fullPath), { recursive: true });

			if (change.operation === "write" || change.operation === "create") {
				fs.writeFileSync(fullPath, change.content || "", "utf8");
			} else if (change.operation === "delete") {
				if (fs.existsSync(fullPath)) {
					fs.unlinkSync(fullPath);
				}
			}
		}

		if (process.env.GITHUB_OUTPUT) {
			const fs_sync = await import("node:fs");
			fs_sync.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`input_tokens=${result.inputTokens}\n`,
			);
			fs_sync.appendFileSync(
				process.env.GITHUB_OUTPUT,
				`output_tokens=${result.outputTokens}\n`,
			);
		}

		console.log("✅ Implementation phase complete.");
	} catch (error) {
		console.error("❌ Development Error:", error.message);
		process.exit(1);
	}
}

main();
