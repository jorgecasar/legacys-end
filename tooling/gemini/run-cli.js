import { spawn as nodeSpawn } from "node:child_process";
import { MODEL_FALLBACK } from "./pricing.js";

/**
 * Robustly extracts the last valid JSON object from a string.
 * @param {string} str - String containing JSON candidates
 * @returns {Object|null} Last parsed JSON object or null
 */
export function extractLastJSON(str) {
	let pos = 0;
	let lastValid = null;
	while (true) {
		pos = str.indexOf("{", pos);
		if (pos === -1) break;
		for (
			let endPos = str.lastIndexOf("}");
			endPos > pos;
			endPos = str.lastIndexOf("}", endPos - 1)
		) {
			const candidate = str.substring(pos, endPos + 1);
			try {
				const parsed = JSON.parse(candidate);
				lastValid = parsed;
				pos = endPos;
				break;
			} catch (_) {}
		}
		pos++;
	}
	return lastValid;
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs Gemini CLI with automatic model fallback and 429 (Rate Limit) handling.
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object} [options={}] - Execution options
 * @param {string} [options.modelType='flash'] - 'flash', 'pro', or 'image'
 * @param {boolean} [options.yolo=false] - If true, auto-approves tool calls
 * @param {string} [options.approvalMode='default'] - CLI approval mode
 * @param {Object} [deps={}] - Injected dependencies
 * @param {Function} [deps.spawn=nodeSpawn] - Spawn function for testing
 * @returns {Promise<Object>} Result object with response, usage tokens, and stats
 * @throws {Error} If CLI fails after retries
 */
export async function runGeminiCLI(prompt, options = {}, deps = {}) {
	const { spawn = nodeSpawn } = deps;
	const {
		modelType = "flash",
		yolo = false,
		approvalMode = "default",
	} = options;
	const fallbackModels = MODEL_FALLBACK[modelType] || ["gemini-2.0-flash"];
	let lastError = null;

	for (const model of fallbackModels) {
		let attempts = 0;
		const maxAttempts = 3;

		while (attempts < maxAttempts) {
			console.log(
				`\n>>> 🚀 Attempt ${attempts + 1}/${maxAttempts} with ${model}...`,
			);

			const args = [
				"@google/gemini-cli",
				"--prompt",
				"-",
				yolo ? "--yolo" : null,
				approvalMode !== "default" ? "--approval-mode" : null,
				approvalMode !== "default" ? approvalMode : null,
				"--extensions",
				"none",
				"--model",
				model,
				"--output-format",
				"json",
			].filter(Boolean);

			try {
				const output = await new Promise((resolve, reject) => {
					const child = spawn("npx", args, {
						stdio: ["pipe", "pipe", "inherit"],
					});

					let stdoutAccumulator = "";

					child.stdin.write(prompt);
					child.stdin.end();

					const onData = (data) => {
						const chunk = data.toString();
						process.stdout.write(chunk);
						stdoutAccumulator += chunk;
					};

					const onTimeout = () => {
						child.kill();
						reject(new Error("Serena is non-responsive. Timing out."));
					};

					const onClose = (code) => {
						clearTimeout(timeout);
						if (code === 0 || code === null) {
							resolve(stdoutAccumulator);
						} else {
							const isQuotaError =
								stdoutAccumulator.includes("exhausted your capacity") ||
								stdoutAccumulator.includes("Quota exceeded") ||
								stdoutAccumulator.includes("429");

							const error = new Error(`CLI exited with code ${code}`);
							error.isQuota = isQuotaError;
							error.output = stdoutAccumulator;
							reject(error);
						}
					};

					const onError = (err) => {
						clearTimeout(timeout);
						reject(err);
					};

					child.stdout.on("data", onData);

					const timeout = setTimeout(onTimeout, 600000); // 10 minutes

					child.on("close", onClose);
					child.on("error", onError);
				});

				const jsonResult = extractLastJSON(output);
				let inputTokens = jsonResult?.usageMetadata?.promptTokenCount || 0;
				let outputTokens = jsonResult?.usageMetadata?.candidatesTokenCount || 0;

				if (inputTokens === 0 && jsonResult?.stats?.models) {
					for (const m in jsonResult.stats.models) {
						const s = jsonResult.stats.models[m];
						inputTokens += s.tokens?.input || 0;
						outputTokens += s.tokens?.candidates || 0;
					}
				}

				if (inputTokens > 0) {
					console.log(
						`\n✅ Task Complete. Tokens: ${inputTokens} in / ${outputTokens} out.`,
					);
				}

				return { ...jsonResult, inputTokens, outputTokens, modelUsed: model };
			} catch (error) {
				lastError = error;

				if (error.isQuota) {
					attempts++;
					const waitMatch = error.output.match(/reset after (\d+)s/);
					const waitSeconds = waitMatch
						? parseInt(waitMatch[1], 10)
						: attempts * 10;

					console.warn(
						`\n⚠️  Rate Limit (429) hit for ${model}. Waiting ${waitSeconds + 2}s before retry...`,
					);
					await sleep((waitSeconds + 2) * 1000);
					continue;
				}

				console.warn(
					`\n⚠️  ${model} failed: ${error.message}. Trying fallback...`,
				);
				break;
			}
		}
	}

	console.error("\n❌ All available models failed after retries.");
	throw lastError;
}
