import { Signal } from "@lit-labs/signals";
import { logger } from "./logger-service.js";

/**
 * Service for managing Chrome Built-in AI (Prompt API) sessions.
 * Supports multiple independent sessions identified by unique keys.
 *
 * @example
 * // Create sessions for different characters
 * await aiService.createSession("alarion", {
 *   language: "en",
 *   initialPrompts: [...]
 * });
 *
 * await aiService.createSession("rainwalker", {
 *   language: "en",
 *   initialPrompts: [...]
 * });
 *
 * // Retrieve and use sessions
 * const alarionSession = aiService.getSession("alarion");
 * const response = await alarionSession.prompt("Hello");
 *
 * // Cleanup
 * aiService.destroySession("alarion");
 * aiService.destroyAllSessions();
 */

/**
 * @typedef {Object} AIOptions
 * @property {string} language
 * @property {{role: string, content: string}[]} [initialPrompts]
 * @property {function(import('./interfaces.js').AIDownloadProgressEvent): void} [onDownloadProgress]
 */

export class AIService {
	constructor() {
		/** @type {string} */
		this.availabilityStatus = "no";
		/** @type {boolean} */
		this.isAvailable = false;
		/** @type {Map<string, import('./interfaces.js').AIModelSession>} */
		this.sessions = new Map();
		this.isEnabled = new Signal.State(true);
	}

	/**
	 * Check if Chrome Built-in AI is available
	 * @returns {Promise<string>} Availability status
	 */
	async checkAvailability() {
		try {
			// @ts-expect-error - Chrome Built-in AI experimental API
			const ai = window.ai?.languageModel || window.LanguageModel;
			if (!ai) {
				logger.warn("Chrome Built-in AI not supported in this browser");
				this.availabilityStatus = "no";
				return "no";
			}

			const status = await ai.availability();
			this.availabilityStatus = status;
			this.isAvailable = status === "readily" || status === "available";

			logger.debug("🤖 Chrome Built-in AI availability:", status);

			// Provide helpful instructions based on status
			if (status === "no") {
				logger.warn(
					"⚠️ Chrome Built-in AI not available. To enable:\n" +
						"1. Use Chrome Dev/Canary (v127+)\n" +
						"2. Enable flags:\n" +
						"   - chrome://flags/#prompt-api-for-gemini-nano → Enabled\n" +
						"   - chrome://flags/#optimization-guide-on-device-model → Enabled BypassPerfRequirement\n" +
						"3. Restart Chrome\n" +
						"4. Download model at chrome://components/ (search 'Optimization Guide')\n" +
						"5. Verify with: await ai.languageModel.availability()",
				);
			} else if (status === "after-download") {
				logger.warn(
					"⚠️ Chrome Built-in AI requires model download.\n" +
						"Go to chrome://components/ and update 'Optimization Guide On Device Model'",
				);
			}

			return status;
		} catch (error) {
			logger.error("Failed to check AI availability:", error);
			this.availabilityStatus = "no";
			return "no";
		}
	}

	/**
	 * Create a new AI session with a unique identifier
	 * @param {string} sessionId - Unique identifier for this session
	 * @param {AIOptions} options - Session configuration
	 * @returns {Promise<import('./interfaces.js').AIModelSession>} Created AI session
	 */
	async createSession(sessionId, options) {
		// Check if session already exists
		if (this.sessions.has(sessionId)) {
			logger.warn(
				`Session "${sessionId}" already exists. Destroying old session.`,
			);
			this.destroySession(sessionId);
		}

		const status = await this.checkAvailability();

		// Handle downloadable state
		if (status === "downloadable") {
			const session = await this.downloadModel(options);
			this.sessions.set(sessionId, session);
			logger.debug(`✅ Session "${sessionId}" created after download`);
			return session;
		}

		// Only create session if readily available
		if (status !== "readily" && status !== "available") {
			throw new Error(`AI not available. Status: ${status}`);
		}

		try {
			logger.debug(
				`🤖 Creating AI session "${sessionId}" with language: ${options.language}`,
			);
			// @ts-expect-error - experimental API LanguageModel
			const ai = window.ai?.languageModel || window.LanguageModel;

			const { initialPrompts = [], ...rest } = options;
			const systemPromptObj = initialPrompts.find((p) => p.role === "system");
			const systemPrompt = systemPromptObj
				? systemPromptObj.content
				: undefined;
			const remainingPrompts = initialPrompts.filter(
				(p) => p.role !== "system",
			);

			const session = await ai.create({
				...rest,
				systemPrompt,
				initialPrompts: remainingPrompts,
				language: options.language,
				expectedOutputLanguage: options.language,
			});

			this.sessions.set(
				sessionId,
				/** @type {import('./interfaces.js').AIModelSession} */ (session),
			);
			logger.debug(`✅ Session "${sessionId}" created successfully`);
			return session;
		} catch (error) {
			logger.error(`Failed to create session "${sessionId}":`, error);
			throw error;
		}
	}

	/**
	 * Download the AI model (for "downloadable" status)
	 * @param {AIOptions} options - Download options
	 * @returns {Promise<import('./interfaces.js').AIModelSession>} AI session after download
	 */
	async downloadModel(options) {
		logger.info(
			"📥 Chrome Built-in AI model is downloadable.\n" +
				"Attempting to download model automatically...",
		);

		try {
			// @ts-expect-error - experimental API LanguageModel
			const ai = window.ai?.languageModel || window.LanguageModel;
			const session = await ai.create({
				language: options.language,
				expectedOutputLanguage: options.language,
				monitor: (/** @type {any} */ m) => {
					m.addEventListener(
						"downloadprogress",
						(
							/** @type {import('./interfaces.js').AIDownloadProgressEvent} */ e,
						) => {
							const progress = Math.round((e.loaded / e.total) * 100);
							logger.info(
								`📥 Downloading AI model: ${e.loaded}/${e.total} bytes (${progress}%)`,
							);
							if (options.onDownloadProgress) {
								options.onDownloadProgress(e);
							}
						},
					);
				},
			});

			logger.info("✅ AI model downloaded successfully!");
			this.isAvailable = true;
			this.availabilityStatus = "readily";
			return session;
		} catch (error) {
			logger.error("❌ Failed to download AI model:", error);
			logger.warn(
				"Manual download required:\n" +
					"Go to chrome://components/ and update 'Optimization Guide On Device Model'",
			);
			throw error;
		}
	}

	/**
	 * Get an existing session by ID
	 * @param {string} sessionId - Session identifier
	 * @returns {import('./interfaces.js').AIModelSession|null} The session or null if not found
	 */
	getSession(sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session) {
			logger.warn(`Session "${sessionId}" not found`);
			return null;
		}
		return session;
	}

	/**
	 * Check if a session exists
	 * @param {string} sessionId - Session identifier
	 * @returns {boolean} True if session exists
	 */
	hasSession(sessionId) {
		return this.sessions.has(sessionId);
	}

	/**
	 * Destroy a specific session
	 * @param {string} sessionId - Session identifier
	 */
	destroySession(sessionId) {
		const session = this.sessions.get(sessionId);
		if (session) {
			try {
				session.destroy();
				this.sessions.delete(sessionId);
				logger.debug(`🗑️ Session "${sessionId}" destroyed`);
			} catch (error) {
				logger.error(`Failed to destroy session "${sessionId}":`, error);
			}
		}
	}

	/**
	 * Destroy all sessions
	 */
	destroyAllSessions() {
		for (const [sessionId, session] of this.sessions.entries()) {
			try {
				session.destroy();
				logger.debug(`🗑️ Session "${sessionId}" destroyed`);
			} catch (error) {
				logger.error(`Failed to destroy session "${sessionId}":`, error);
			}
		}
		this.sessions.clear();
	}

	/**
	 * Get a chat response from a session
	 * @param {string} sessionId
	 * @param {string} prompt
	 * @returns {Promise<string>}
	 */
	async getChatResponse(sessionId, prompt) {
		const session = this.getSession(sessionId);
		if (!session) return "AI session not available.";
		return await session.prompt(prompt);
	}
}
