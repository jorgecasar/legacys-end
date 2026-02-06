/**
 * DialogueGenerationService - Decouples AI dialogue generation from voice synthesis.
 */
export class DialogueGenerationService {
	/**
	 * @param {import('../types/services.d.js').IAIService} aiService
	 * @param {import('../types/services.d.js').ILoggerService} logger
	 */
	constructor(aiService, logger) {
		this.aiService = aiService;
		this.logger = logger;
		/** @type {Map<string, string>} */
		this.cache = new Map();
		/** @type {Set<string>} */
		this.pending = new Set();
	}

	/**
	 * Generate dialogue for a specific role and prompt
	 * @param {string} role - 'hero' or 'npc'
	 * @param {string} prompt - The AI prompt
	 * @param {boolean} force - Whether to force new generation ignoring cache
	 * @returns {Promise<string>}
	 */
	async generate(role, prompt, force = false) {
		const cacheKey = `${role}:${prompt}`;

		if (!force && this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey) || "";
		}

		const result = await this.#generate(role, prompt);
		this.cache.set(cacheKey, result);
		return result;
	}

	/**
	 * Prefetch dialogue for future use
	 * @param {string} role - 'hero' or 'npc'
	 * @param {string} prompt - The AI prompt
	 */
	async prefetch(role, prompt) {
		const cacheKey = `${role}:${prompt}`;
		if (this.cache.has(cacheKey) || this.pending.has(cacheKey)) return;

		this.pending.add(cacheKey);
		try {
			const result = await this.#generate(role, prompt);
			this.cache.set(cacheKey, result);
		} catch (error) {
			this.logger.error(`❌ Prefetch error (${role}): ${error}`);
		} finally {
			this.pending.delete(cacheKey);
		}
	}

	/**
	 * Internal generation logic
	 * @param {string} role
	 * @param {string} prompt
	 * @returns {Promise<string>}
	 */
	async #generate(role, prompt) {
		try {
			const session = this.aiService.getSession(role);
			if (!session) {
				this.logger.warn(`⚠️ No active AI session found for role: ${role}`);
				return "";
			}

			this.logger.debug(`🤖 Generating ${role} response...`);
			const response = await session.prompt(prompt);
			const cleanResponse = response.replace(/```json|```/g, "").trim();

			this.logger.info(`🤖 ${role} Generated: ${cleanResponse}`);
			return cleanResponse;
		} catch (error) {
			this.logger.error(`❌ AI Generation error (${role}): ${error}`);
			throw error;
		}
	}

	clearCache() {
		this.cache.clear();
		this.pending.clear();
	}
}
