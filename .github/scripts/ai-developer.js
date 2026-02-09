import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Configuración ---
const GENAI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = process.argv[2] || "gemini-3-flash-preview";
const ISSUE_NUMBER = process.argv[3];

if (!GENAI_API_KEY || !ISSUE_NUMBER) {
	console.error("❌ Missing GEMINI_API_KEY or ISSUE_NUMBER");
	process.exit(1);
}

const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

function gh(args) {
	return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
}

async function main() {
	console.error(
		`🚀 Starting Native Agent with model ${MODEL_ID} for Issue #${ISSUE_NUMBER}`,
	);

	// 1. Obtener contexto de la Issue
	const issueData = JSON.parse(
		gh(`issue view ${ISSUE_NUMBER} --json title,body`),
	);

	// 2. Escaneo rápido de archivos (Mapa de contexto mínimo)
	const fileList = execSync('find src -maxdepth 3 -not -path "*/.*"', {
		encoding: "utf8",
	});

	// 3. Cargar reglas del proyecto
	const rules = fs
		.readdirSync(".rulesync/rules")
		.map((f) => {
			return `RULE [${f}]:\n${fs.readFileSync(path.join(".rulesync/rules", f), "utf8")}`;
		})
		.join("\n\n");

	const prompt = `
    TASK: ${issueData.title}
    GOAL: ${issueData.body}

    PROJECT RULES:
    ${rules}

    AVAILABLE FILES (src/):
    ${fileList}

    INSTRUCTIONS:
    1. Identify the files that need to be created or modified.
    2. Return a JSON object with the following structure:
       {
         "thought": "Brief explanation of the plan",
         "changes": [
           { "path": "src/path/to/file.js", "content": "FULL NEW CONTENT" }
         ]
       }
    4. Do NOT include any text before or after the JSON.
    5. Always follow the project standards: ESM, node: protocol, double quotes, Result pattern for errors.
    `;

	try {
		const model = genAI.getGenerativeModel({ model: MODEL_ID });
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		// Extraer JSON (limpiar posibles backticks de markdown)
		const jsonStr = text.replace(/```json|```/g, "").trim();
		const plan = JSON.parse(jsonStr);

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

main();
