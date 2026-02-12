import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_PRICING, MODEL_FALLBACK } from "./pricing.js";

/**
 * Run Gemini with intelligent fallback and structured output
 */
export async function runWithFallback(modelType, prompt, options = {}) {
	let {
		apiKey = process.env.GEMINI_API_KEY,
		maxRetries = 3,
		responseSchema,
		systemInstruction,
		generationConfig: configOverrides = {},
	} = options;

	// Prioritize key from .env file if it exists (Node.js --env-file doesn't overwrite)
	try {
		if (fs.existsSync(".env")) {
			const envContent = fs.readFileSync(".env", "utf8");
			const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
			if (match?.[1]) {
				apiKey = match[1].trim().replace(/^["']|["']$/g, "");
			}
		}
	} catch (_e) {
		// Fallback to existing apiKey if reading .env fails
	}

	if (!apiKey) {
		throw new Error("GEMINI_API_KEY required.");
	}

	// Limpieza de la clave
	const sanitizedKey = apiKey
		.toString()
		.trim()
		.replace(/^["']|["']$/g, "")
		.split(/\s/)[0];

	const ai = new GoogleGenAI({ apiKey: sanitizedKey });
	const models = MODEL_FALLBACK[modelType];
	let lastError;

	for (const modelName of models) {
		console.log(`Trying model: ${modelName}`);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const isPro = modelName.includes("pro");
				const generationConfig = {
					maxOutputTokens: isPro ? 4096 : 2048,
					temperature: 0,
					...configOverrides,
				};

				if (responseSchema) {
					generationConfig.responseMimeType = "application/json";
					generationConfig.responseSchema = responseSchema;
				}

				const enhancedPrompt =
					responseSchema && attempt > 1
						? `${prompt}\n\nCRITICAL: Return ONLY a valid JSON object. No conversational text, headers, or explanations.`
						: prompt;

				const systemContent = responseSchema
					? systemInstruction
						? `${systemInstruction}\n\nStrict JSON Mode: Output must be ONLY the JSON object.`
						: "Strict JSON Mode: Output must be ONLY the JSON object."
					: systemInstruction;

				const result = await ai.models.generateContent({
					model: modelName,
					systemInstruction: systemContent
						? { parts: [{ text: systemContent }] }
						: undefined,
					contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
					config: generationConfig,
				});

				const usage = result.usageMetadata || {};
				const inputTokens = usage.promptTokenCount || 0;
				const outputTokens = usage.candidatesTokenCount || 0;

				console.log(
					`✅ Success with ${modelName} (${inputTokens} in / ${outputTokens} out)`,
				);

				const text = result.text || "";

				if (responseSchema && (!text || text.trim() === "")) {
					throw new Error("EMPTY_RESPONSE: Model returned no content.");
				}

				let data = text;

				if (responseSchema) {
					try {
						// Intentamos usar .parsed si el SDK lo ofrece o parseamos el texto
						data = result.parsed || JSON.parse(text);
					} catch (_e) {
						// Extracción robusta si falla el parseo directo
						try {
							const firstBrace = text.indexOf("{");
							const lastBrace = text.lastIndexOf("}");
							if (
								firstBrace !== -1 &&
								lastBrace !== -1 &&
								lastBrace > firstBrace
							) {
								data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
							} else {
								const cleanJson = text.replace(/```json\s*|```/g, "").trim();
								data = JSON.parse(cleanJson);
							}
						} catch (finalErr) {
							console.error(
								"Failed to extract JSON from model response:",
								text.substring(0, 100) + "...",
							);
							throw new Error(`JSON_PARSE_ERROR: ${finalErr.message}`);
						}
					}
				}

				return {
					data,
					text,
					modelUsed: modelName,
					inputTokens,
					outputTokens,
					pricing: GEMINI_PRICING[modelName],
				};
			} catch (err) {
				lastError = err;
				console.error(
					`❌ ${modelName} failed (attempt ${attempt}):`,
					err.message,
				);

				if (err.message?.includes("429") || err.message?.includes("quota"))
					break;

				if (attempt < maxRetries) {
					await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
				}
			}
		}
	}

	throw new Error(`All models failed. Last error: ${lastError?.message}`);
}
