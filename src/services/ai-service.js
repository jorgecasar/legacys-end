import { Signal } from "@lit-labs/signals";

/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/services.d.js').AIDownloadProgressEvent} AIDownloadProgressEvent
 */

/**
 * @typedef {Object} AIOptions
 * @property {string} language
 * @property {{role: string, content: string}[]} [initialPrompts]
 * @property {function(AIDownloadProgressEvent): void} [onDownloadProgress]
 */

export class AIService {
	/**
	 * @param {Object} [options]
	 * @param {ILoggerService} [options.logger]
	 */
	constructor(options = {}) {
		this.logger = options.logger;
		/** @type {string} */
		this.availabilityStatus = "no";
		/** @type {boolean} */
		this.isAvailable = false;
		/** @type {Map<string, import('../types/services.d.js').AIModelSession>} */
		this.sessions = new Map();
		this.isEnabled = new Signal.State(true);
	}

	/**
	 * Private getter for Chrome Built-in AI (Prompt API)
	 * @returns {import('../types/services.d.js').AILanguageModel | undefined}
	 */
	get #ai() {
		// @ts-expect-error - Chrome Built-in AI experimental API
		return window.ai?.languageModel;
	}

	/**
	 * Check if Chrome Built-in AI is available
	 * @returns {Promise<string>} Availability status
	 */
	async checkAvailability() {
		try {
			if (!this.#ai) {
				this.logger?.warn("Chrome Built-in AI not supported in this browser");
				this.availabilityStatus = "no";
				return "no";
			}

			const status = await this.#ai.availability();
			this.availabilityStatus = status;
			this.isAvailable = status === "readily" || status === "available";

			this.logger?.debug("🤖 Chrome Built-in AI availability:", { status });

			// Provide helpful instructions based on status
			if (status === "no") {
				this.logger?.warn(
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
				this.logger?.warn(
					"⚠️ Chrome Built-in AI requires model download.\n" +
						"Go to chrome://components/ and update 'Optimization Guide On Device Model'",
				);
			}

			return status;
		} catch (error) {
			this.logger?.error("Failed to check AI availability:", error);
			this.availabilityStatus = "no";
			return "no";
		}
	}

	/**
	 * Create a new AI session with a unique identifier
	 * @param {string} sessionId - Unique identifier for this session
	 * @param {AIOptions} options - Session configuration
	 * @returns {Promise<import('../types/services.d.js').AIModelSession>} Created AI session
	 */
	async createSession(sessionId, options) {
		// Check if session already exists
		if (this.sessions.has(sessionId)) {
			this.logger?.warn(
				`Session "${sessionId}" already exists. Destroying old session.`,
			);
			this.destroySession(sessionId);
		}

		const status = await this.checkAvailability();

		// Handle downloadable state
		if (status === "downloadable") {
			const session = await this.downloadModel(options);
			this.sessions.set(sessionId, session);
			this.logger?.debug(`✅ Session "${sessionId}" created after download`);
			return session;
		}

		// Only create session if readily available
		if (status !== "readily" && status !== "available") {
			throw new Error(`AI not available. Status: ${status}`);
		}

		try {
			this.logger?.debug(
				`🤖 Creating AI session "${sessionId}" with language: ${options.language}`,
			);
			if (!this.#ai) {
				throw new Error("AI model API not available");
			}

			const { initialPrompts = [], ...rest } = options;
			const systemPromptObj = initialPrompts.find((p) => p.role === "system");
			const systemPrompt = systemPromptObj
				? systemPromptObj.content
				: undefined;
			const remainingPrompts = initialPrompts.filter(
				(p) => p.role !== "system",
			);

			const session = await this.#ai.create({
				...rest,
				systemPrompt,
				initialPrompts: remainingPrompts,
				language: options.language,
				expectedOutputLanguage: options.language,
			});

			this.sessions.set(
				sessionId,
				/** @type {import('../types/services.d.js').AIModelSession} */ (
					session
				),
			);
			this.logger?.debug(`✅ Session "${sessionId}" created successfully`);
			return session;
		} catch (error) {
			this.logger?.error(`Failed to create session "${sessionId}":`, error);
			throw error;
		}
	}

	/**
	 * Download the AI model (for "downloadable" status)
	 * @param {AIOptions} options - Download options
	 * @returns {Promise<import('../types/services.d.js').AIModelSession>} AI session after download
	 */
	async downloadModel(options) {
		this.logger?.info(
			"📥 Chrome Built-in AI model is downloadable.\n" +
				"Attempting to download model automatically...",
		);

		try {
			if (!this.#ai) {
				throw new Error("AI model API not available");
			}
			const session = await this.#ai.create({
				language: options.language,
				expectedOutputLanguage: options.language,
				monitor: (/** @type {any} */ m) => {
					m.addEventListener(
						"downloadprogress",
						(
							/** @type {import('../types/services.d.js').AIDownloadProgressEvent} */ e,
						) => {
							const progress = Math.round((e.loaded / e.total) * 100);
							this.logger?.info(
								`📥 Downloading AI model: ${e.loaded}/${e.total} bytes (${progress}%)`,
							);
							if (options.onDownloadProgress) {
								options.onDownloadProgress(e);
							}
						},
					);
				},
			});

			this.logger?.info("✅ AI model downloaded successfully!");
			this.isAvailable = true;
			this.availabilityStatus = "readily";
			return session;
		} catch (error) {
			this.logger?.error("❌ Failed to download AI model:", error);
			this.logger?.warn(
				"Manual download required:\n" +
					"Go to chrome://components/ and update 'Optimization Guide On Device Model'",
			);
			throw error;
		}
	}

	/**
	 * Get an existing session by ID
	 * @param {string} sessionId - Session identifier
	 * @returns {import('../types/services.d.js').AIModelSession|null} The session or null if not found
	 */
	getSession(sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session) {
			this.logger?.warn(`Session "${sessionId}" not found`);
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
				this.logger?.debug(`🗑️ Session "${sessionId}" destroyed`);
			} catch (error) {
				this.logger?.error(`Failed to destroy session "${sessionId}":`, error);
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
				this.logger?.debug(`🗑️ Session "${sessionId}" destroyed`);
			} catch (error) {
				this.logger?.error(`Failed to destroy session "${sessionId}":`, error);
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
