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
		if (data.error) throw new Error(data.error_description || data.error);
		return data.access_token;
	} catch (error) {
		console.error("⚠️ OAuth Refresh Error:", error.message);
		return null;
	}
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
	const apiKey = (
		process.env.GEMINI_API_KEY ||
		process.env.GOOGLE_API_KEY ||
		""
	).trim();
	const accessToken = await getAccessToken();

	if (!apiKey && !accessToken) {
		console.error(
			"❌ Missing Auth: Set GEMINI_API_KEY or GOOGLE_REFRESH_TOKEN/CLIENT_ID/SECRET",
		);
		process.exit(1);
	}

	console.error(
		`🚀 Starting AI Agent with model ${modelId} for Issue #${issueNumber}`,
	);

	let url;
	const headers = { "Content-Type": "application/json" };

	if (accessToken) {
		console.error("🔐 Auth: Using Google OAuth (Personal Pro Identity)");
		headers["Authorization"] = `Bearer ${accessToken}`;
		// Endpoint de Vertex AI (Soporta OAuth con cloud-platform scope)
		// Nota: Requiere un Project ID. Intentaremos usar uno genérico o del entorno.
		const projectId =
			process.env.GOOGLE_CLOUD_PROJECT || "gen-lang-client-0739017663";
		url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:streamGenerateContent`;
	} else {
		console.error("ℹ️ Auth: Using standard API Key");
		headers["x-goog-api-key"] = apiKey;
		url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
	}

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
    3. Return ONLY JSON. No other text.
    `;

		const response = await fetch(url, {
			method: "POST",
			headers: headers,
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
			}),
		});

		const text = await response.text();
		let result;

		try {
			// Vertex AI devuelve un stream (array de objetos) en streamGenerateContent
			// Si es el endpoint normal de AI Studio, es un objeto único.
			const parsed = JSON.parse(text);
			result = Array.isArray(parsed) ? parsed[0] : parsed;
		} catch (e) {
			throw new Error(`Server returned non-JSON response: ${text}`);
		}

		if (result.error) {
			throw new Error(
				`API Error ${result.error.code}: ${result.error.message}`,
			);
		}

		// En Vertex AI el campo puede variar ligeramente, normalizamos:
		const candidates =
			result.candidates ||
			(Array.isArray(result) ? result[0].candidates : null);
		if (!candidates?.[0]?.content?.parts?.[0]?.text) {
			throw new Error(`Unexpected Response Format: ${text}`);
		}

		const plan = parseAIResponse(candidates[0].content.parts[0].text);
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
	const modelId = process.argv[2] || "gemini-1.5-pro"; // Modelos de Vertex usan nombres distintos
	const issueNum = process.argv[3];
	main(modelId, issueNum);
}
