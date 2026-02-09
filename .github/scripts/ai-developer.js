import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Dependencias para Mocking ---
export const deps = {
	execSync,
	readFileSync: fs.readFileSync,
	writeFileSync: fs.writeFileSync,
	readdirSync: fs.readdirSync,
	existsSync: fs.existsSync,
	mkdirSync: fs.mkdirSync,
	GoogleGenerativeAI,
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
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
	if (!apiKey || !issueNumber) {
		console.error("❌ Missing GEMINI_API_KEY/GOOGLE_API_KEY or ISSUE_NUMBER");
		console.error(
			`- API Key present: ${!!apiKey} (Length: ${apiKey?.length || 0})`,
		);
		console.error(`- Issue Number: ${issueNumber}`);
		process.exit(1);
	}

	console.error(
		`🚀 Starting Native Agent with model ${modelId} for Issue #${issueNumber}`,
	);
	console.error(
		`ℹ️ API Key loaded (starts with: ${apiKey.substring(0, 4)}... length: ${apiKey.length})`,
	);

	try {
		// 1. Obtener contexto de la Issue
		const issueData = JSON.parse(
			gh(`issue view ${issueNumber} --json title,body`),
		);

		// 2. Escaneo rápido de archivos
		const fileList = deps.execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});

		// 3. Cargar reglas
		const rules = getProjectRules();

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

		const genAI = new deps.GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: modelId });
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const plan = parseAIResponse(response.text());

		console.error(`📝 Plan: ${plan.thought}`);

		for (const change of plan.changes) {
			const dir = path.dirname(change.path);
			if (!deps.existsSync(dir)) deps.mkdirSync(dir, { recursive: true });
			deps.writeFileSync(change.path, change.content);
			console.error(`✅ Updated: ${change.path}`);
		}

		console.error("🎉 All changes applied successfully.");
	} catch (error) {
		console.error("💥 Agent Error:", error.message);
		process.exit(1);
	}
}

// Ejecutar si es el script principal
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const modelId = process.argv[2] || "gemini-3-flash-preview";
	const issueNum = process.argv[3];
	main(modelId, issueNum);
}
