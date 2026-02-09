import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
			execSync(`gh issue view ${issueNumber} --json title,body`, {
				encoding: "utf8",
			}),
		);

		// 2. Escaneo de archivos
		const fileList = execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});

		// 3. Preparar Prompt para el CLI
		const prompt = `
        You are an elite developer agent. 
        TASK: ${issueData.title}
        GOAL: ${issueData.body}
        
        AVAILABLE FILES:
        ${fileList}

        INSTRUCTIONS:
        1. Analyze the project rules in .rulesync/rules/
        2. Modify the necessary files in src/
        3. Return a JSON object with your plan and changes:
           { "thought": "...", "changes": [{ "path": "...", "content": "..." }] }
        `;

		// 4. EJECUTAR COMANDO GEMINI CLI
		// Usamos el comando 'gemini' directamente como pides
		const geminiCmd = `gemini --model ${modelId} "${prompt.replace(/"/g, '\\"')}"`;
		console.error("📡 Calling Gemini CLI...");

		const response = execSync(geminiCmd, {
			encoding: "utf8",
			env: { ...process.env, GEMINI_API_KEY: apiKey },
		});

		// 5. Procesar respuesta
		const jsonStr = response.replace(/```json|```/g, "").trim();
		const plan = JSON.parse(jsonStr);

		console.error(`📝 Plan: ${plan.thought}`);

		for (const change of plan.changes) {
			const dir = path.dirname(change.path);
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(change.path, change.content);
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
