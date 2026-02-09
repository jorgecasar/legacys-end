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

async function getAccessToken() {
	const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	if (!refreshToken || !clientId || !clientSecret) return null;

	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		});

		const data = await response.json();
		return data.access_token;
	} catch (error) {
		console.error("⚠️ Error refreshing OAuth token:", error.message);
		return null;
	}
}

export async function main(modelId, issueNumber) {
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
	const accessToken = await getAccessToken();

	if (!apiKey && !accessToken) {
		console.error(
			"❌ Missing Auth: Need GEMINI_API_KEY or GOOGLE_REFRESH_TOKEN",
		);
		process.exit(1);
	}

	console.error(
		`🚀 Starting Native Agent with model ${modelId} for Issue #${issueNumber}`,
	);

	const headers = { "Content-Type": "application/json" };
	let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

	if (accessToken) {
		console.error("🔐 Authenticated using Google AI Pro (OAuth Bearer)");
		headers["Authorization"] = `Bearer ${accessToken}`;
	} else {
		console.error("ℹ️ Using standard API Key");
		url += `?key=${apiKey.trim()}`;
	}

	try {
		// 1. Contexto de la Issue
		const issueData = JSON.parse(
			gh(`issue view ${issueNumber} --json title,body`),
		);

		// 2. Archivos disponibles
		const fileList = deps.execSync('find src -maxdepth 3 -not -path "*/.*"', {
			encoding: "utf8",
		});

		// 3. Reglas
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

		const response = await fetch(url, {
			method: "POST",
			headers: headers,
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
			}),
		});

		const result = await response.json();

		if (result.error) {
			throw new Error(
				`API Error ${result.error.code}: ${result.error.message}`,
			);
		}

		if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
			throw new Error(`Unexpected API Response: ${JSON.stringify(result)}`);
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

// Ejecutar si es el script principal
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const modelId = process.argv[2] || "gemini-3-flash-preview";
	const issueNum = process.argv[3];
	main(modelId, issueNum);
}
