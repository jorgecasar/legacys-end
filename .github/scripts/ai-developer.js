import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- Dependencias para Mocking ---
export const deps = {
	execSync,
	readFileSync: fs.readFileSync,
	writeFileSync: fs.writeFileSync,
	readdirSync: fs.readdirSync,
	existsSync: fs.existsSync,
	mkdirSync: fs.mkdirSync,
};

function gh(args) {
	return deps.execSync(`gh ${args}`, { encoding: "utf8" }).trim();
}

export function parseAIResponse(text) {
	try {
		const jsonStr = text.replace(/```json|```/g, "").trim();
		return JSON.parse(jsonStr);
	} catch (error) {
		throw new Error(
			`Failed to parse AI response as JSON: ${error.message}\nRaw text: ${text}`,
		);
	}
}

export function getProjectRules(rulesDir = ".rulesync/rules") {
	if (!deps.existsSync(rulesDir)) return "";
	return deps
		.readdirSync(rulesDir)
		.map((f) => {
			const content = deps.readFileSync(path.join(rulesDir, f), "utf8");
			return `RULE [${f}]:\n${content}`;
		})
		.join("\n\n");
}

export async function main(modelId, issueNumber) {
	// Limpieza estricta de la API Key
	const apiKey = (
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY ||
		""
	).trim();

	if (!apiKey || apiKey.length < 10) {
		console.error(
			"❌ Invalid or missing API Key. Please check your .env or GEMINI_API_KEY variable.",
		);
		process.exit(1);
	}

	console.error(
		`🚀 Starting AI Agent with model ${modelId} for Issue #${issueNumber}`,
	);
	console.error(
		`ℹ️ Auth: Using AI Studio Pro Key (Starts: ${apiKey.substring(0, 4)}...)`,
	);

	// Endpoint de AI Studio (Soporta Gemini 3 Pro Preview)
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

	try {
		const issueData = JSON.parse(
			gh(`issue view ${issueNumber} --json title,body`),
		);
		const fileList = deps.execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});
		const rules = getProjectRules();

		const prompt = `
    TASK: ${issueData.title}
    GOAL: ${issueData.body}
    PROJECT RULES:
    ${rules}
    AVAILABLE FILES (src/):
    ${fileList}
    INSTRUCTIONS:
    1. Identify files to modify.
    2. Return a JSON object: { "thought": "...", "changes": [{ "path": "...", "content": "..." }] }
    3. Return ONLY JSON.
    `;

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
			}),
		});

		const text = await response.text();
		let result;
		try {
			result = JSON.parse(text);
		} catch (e) {
			throw new Error(`Server returned non-JSON: ${text}`);
		}

		if (result.error) {
			throw new Error(
				`API Error ${result.error.code}: ${result.error.message}`,
			);
		}

		if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
			throw new Error(
				`No candidates in response. Check quota or safety filters.`,
			);
		}

		const plan = parseAIResponse(result.candidates[0].content.parts[0].text);
		console.error(`📝 Plan: ${plan.thought}`);

		for (const change of plan.changes) {
			const dir = path.dirname(change.path);
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(change.path, change.content);
			console.error(`✅ Updated: ${change.path}`);
		}

		console.error("🎉 All changes applied successfully.");
	} catch (error) {
		console.error("💥 Agent Error:", error.message);
		process.exit(1);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const modelId = process.argv[2] || "gemini-3-flash-preview";
	const issueNum = process.argv[3];
	main(modelId, issueNum);
}
