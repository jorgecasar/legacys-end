import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- Cargar variables de entorno local si existen (.env o .env.local) ---
for (const envFile of [".env.local", ".env"]) {
	if (fs.existsSync(envFile)) {
		try {
			process.loadEnvFile(envFile);
		} catch (e) {
			console.error(`⚠️ No se pudo cargar ${envFile}:`, e.message);
		}
	}
}

// --- Dependencias para Mocking ---
export const deps = {
	execSync,
	spawn,
	readFileSync: fs.readFileSync,
	writeFileSync: fs.writeFileSync,
	readdirSync: fs.readdirSync,
	existsSync: fs.existsSync,
	mkdirSync: fs.mkdirSync,
};

export function parseAIResponse(text) {
	try {
		// 1. Intentar encontrar un bloque de código JSON con regex
		const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
		const cleanText = jsonMatch ? jsonMatch[1] : text;

		// 2. Limpiar posibles restos de markdown si no se encontró bloque
		const finalJson = cleanText.replace(/```json|```/g, "").trim();

		return JSON.parse(finalJson);
	} catch (error) {
		throw new Error(
			`Failed to parse AI response as JSON: ${error.message}\nRaw text snippet: ${text.substring(0, 200)}...`,
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
	if (!issueNumber) {
		console.error("❌ Missing ISSUE_NUMBER");
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

		// 2. Escaneo de archivos y reglas
		const fileList = deps.execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});
		const rules = getProjectRules();

		// 3. Preparar Prompt
		const prompt = `
        You are an elite developer agent. 
        
        PROJECT RULES:
        ${rules}

        TASK: ${issueData.title}
        GOAL: ${issueData.body}
        
        AVAILABLE FILES:
        ${fileList}
        
        INSTRUCTIONS:
        1. Analyze project rules and task.
        2. Propose necessary file changes.
        3. Return a valid JSON object following exactly this structure:
           {
             "thought": "Brief explanation of your approach",
             "changes": [
               { "path": "relative/path/to/file", "content": "Full new content of the file" }
             ]
           }
        
        IMPORTANT: Your entire response must be a single JSON object. Do not include any text before or after the JSON block.
        `;

		// 4. EJECUTAR COMANDO GEMINI CLI (Stream Mode)
		console.error(
			"📡 Calling Gemini CLI (this may take a minute for Pro models)...",
		);

		const gemini = deps.spawn(
			"gemini",
			["--model", modelId, "--prompt", prompt],
			{
				env: { ...process.env },
			},
		);

		let response = "";
		gemini.stdout.on("data", (data) => {
			response += data.toString();
		});

		gemini.stderr.on("data", (data) => {
			// Redirigir logs internos del CLI a stderr para visibilidad
			process.stderr.write(data);
		});

		const exitCode = await new Promise((resolve) =>
			gemini.on("close", resolve),
		);

		if (exitCode !== 0) {
			throw new Error(`Gemini CLI exited with code ${exitCode}`);
		}

		// 5. Procesar respuesta
		const plan = parseAIResponse(response);

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
