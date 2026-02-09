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
	const apiKey = (
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY ||
		""
	).trim();

	if (!apiKey || !issueNumber) {
		console.error("❌ Missing GEMINI_API_KEY or ISSUE_NUMBER");
		process.exit(1);
	}

	console.error(
		`🚀 Running Gemini CLI Engine with model ${modelId} for Issue #${issueNumber}`,
	);

	try {
		// 1. Obtener contexto de la Issue
		const issueData = JSON.parse(
			deps.execSync(`gh issue view ${issueNumber} --json title,body`, {
				encoding: "utf8",
			}),
		);

		// 2. Escaneo de archivos
		const fileList = deps.execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});

		// 3. Preparar Prompt
		const prompt = `
        You are an elite developer agent. 
        TASK: ${issueData.title}
        GOAL: ${issueData.body}
        
        AVAILABLE FILES:
        ${fileList}

        INSTRUCTIONS:
        1. Analyze the project rules.
        2. Modify necessary files.
        3. Return a JSON object: { "thought": "...", "changes": [{ "path": "...", "content": "..." }] }
        `;

		// 4. EJECUTAR COMANDO GEMINI CLI
		const geminiCmd = `gemini --model ${modelId} "${prompt.replace(/"/g, '\\"')}"`;
		console.error("📡 Calling Gemini CLI...");

		const response = deps.execSync(geminiCmd, {
			encoding: "utf8",
			env: { ...process.env, GEMINI_API_KEY: apiKey },
		});

		// 5. Procesar respuesta
		const plan = parseAIResponse(response);

		console.error(`📝 Plan: ${plan.thought}`);

		for (const change of plan.changes) {
			const dir = path.dirname(change.path);
			if (!deps.existsSync(dir)) deps.mkdirSync(dir, { recursive: true });
			deps.writeFileSync(change.path, change.content);
			console.error(`✅ Updated: ${change.path}`);
		}

		console.error("🎉 Gemini CLI successfully applied all changes.");
	} catch (error) {
		console.error("💥 Gemini CLI Error:", error.message);
		process.exit(1);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const modelId = process.argv[2] || "gemini-3-flash-preview";
	const issueNum = process.argv[3];
	main(modelId, issueNum);
}
