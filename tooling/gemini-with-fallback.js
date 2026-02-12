#!/usr/bin/env node
/**
 * Gemini with Intelligent Fallback and Structured Output
 *
 * Using the official @google/genai SDK.
 */

import { GoogleGenAI } from "@google/genai";
import { GEMINI_PRICING, MODEL_FALLBACK } from "./gemini-pricing.js";

/**
 * Run Gemini with intelligent fallback and structured output
 */
export async function runWithFallback(modelType, prompt, options = {}) {
	const {
		apiKey = process.env.GEMINI_API_KEY,
		maxRetries = 3,
		responseSchema,
	} = options;

	if (!apiKey) {
		throw new Error("GEMINI_API_KEY required.");
	}

	// Limpieza agresiva: quita espacios, comillas, retornos de carro y posibles comentarios
	const sanitizedKey = apiKey
		.toString()
		.trim()
		.replace(/^["']|["']$/g, "") // Quita comillas al inicio y final
		.split(/\s/)[0]; // Se queda solo con la primera palabra

	// Instanciamos el cliente exactamente como en tu prueba de éxito
	const ai = new GoogleGenAI({ apiKey: sanitizedKey });
	const models = MODEL_FALLBACK[modelType];
	let lastError;

	for (const modelName of models) {
		console.log(`Trying model: ${modelName}`);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const generationConfig = {
					maxOutputTokens: 2048,
					temperature: 0.1,
				};

				if (responseSchema) {
					generationConfig.responseMimeType = "application/json";
					generationConfig.responseSchema = responseSchema;
				}

				const result = await ai.models.generateContent({
					model: modelName,
					contents: [{ role: "user", parts: [{ text: prompt }] }],
					generationConfig,
				});

				const usage = result.usageMetadata || {};
				const inputTokens = usage.promptTokenCount || 0;
				const outputTokens = usage.candidatesTokenCount || 0;

				console.log(
					`✅ Success with ${modelName} (${inputTokens} in / ${outputTokens} out)`,
				);

				let data = result.text;
				if (responseSchema) {
					try {
						// Intentamos usar .parsed (que ofrece el nuevo SDK) o parsear el texto
						data = result.parsed || JSON.parse(result.text);
					} catch (e) {
						// Limpieza manual si hay markdown
						const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
						data = JSON.parse(cleanJson);
					}
				}

				return {
					data,
					text: result.text,
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
