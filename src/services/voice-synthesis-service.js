/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 */

/**
 * VoiceSynthesisService - Wrapper for Web Speech API
 * Generic service for handling text-to-speech.
 */
export class VoiceSynthesisService {
	/**
	 * @param {Object} [options]
	 * @param {ILoggerService} [options.logger]
	 */
	constructor(options = {}) {
		this.logger = options.logger;
		/** @type {SpeechSynthesisVoice[]} */
		this.voices = [];
		/** @type {boolean} */
		this.isSpeaking = false;

		if (this.#synthesis) {
			this.#loadVoices();
			if (this.#synthesis.onvoiceschanged !== undefined) {
				this.#synthesis.onvoiceschanged = () => this.#loadVoices();
			}
		}
	}

	/**
	 * Private getter for browser speechSynthesis
	 * @returns {SpeechSynthesis | undefined}
	 */
	get #synthesis() {
		return window.speechSynthesis;
	}

	#loadVoices() {
		this.voices = this.#synthesis?.getVoices() || [];
	}

	/**
	 * Get the best available voice for a language from a preferred list
	 * @param {string} lang - Language code (e.g., 'en-US')
	 * @param {string[]} preferredNames - List of preferred voice names
	 * @returns {SpeechSynthesisVoice|null}
	 */
	getBestVoice(lang, preferredNames = []) {
		if (!this.voices.length) return null;

		const searchLang = lang.startsWith("es") ? "es" : "en";

		// Filter voices by language
		const langVoices = this.voices
			.filter((v) => v.lang.toLowerCase().startsWith(searchLang))
			.sort((a, b) => {
				// Score "Natural" or "Enhanced" voices higher if available
				const aScore =
					(a.name.includes("Natural") ? 2 : 0) +
					(a.name.includes("Enhanced") ? 1 : 0);
				const bScore =
					(b.name.includes("Natural") ? 2 : 0) +
					(b.name.includes("Enhanced") ? 1 : 0);
				return bScore - aScore;
			});

		if (langVoices.length === 0) return null;

		// 1. Try preferred names
		for (const name of preferredNames) {
			const found = langVoices.find((v) => v.name.includes(name));
			if (found) return found;
		}

		// 2. Fallback to first available for that language
		return langVoices[0] || null;
	}

	/**
	 * Speak text with voice synthesis
	 * @param {string} text - Text to speak
	 * @param {Object} options - Speech options
	 * @param {string} [options.lang] - Language code
	 * @param {SpeechSynthesisVoice|null} [options.voice] - specific voice object
	 * @param {number} [options.rate] - Speech rate
	 * @param {number} [options.pitch] - Speech pitch
	 * @param {boolean} [options.queue] - Whether to queue or interrupt current speech
	 * @param {() => void} [options.onStart] - Callback when speech starts
	 * @param {() => void} [options.onEnd] - Callback when speech ends
	 * @param {(event: Event) => void} [options.onError] - Callback on error
	 * @returns {Promise<void>} Resolves when speech ends or is interrupted
	 */
	speak(text, options = {}) {
		return new Promise((resolve) => {
			// Validate text parameter
			if (!text || typeof text !== "string") {
				this.logger?.warn("VoiceSynthesisService.speak: Invalid or empty text");
				resolve();
				return;
			}

			if (!this.#synthesis) {
				this.logger?.warn(
					"VoiceSynthesisService.speak: Speech synthesis not available",
				);
				resolve();
				return;
			}

			const {
				lang = "en-US",
				voice = null,
				rate = 1.0,
				pitch = 1.0,
				queue = false,
				onStart,
				onEnd,
				onError,
			} = options;

			this.isSpeaking = true;

			if (!queue) {
				this.#synthesis?.cancel();
			}

			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = lang;
			utterance.rate = rate;
			utterance.pitch = pitch;

			if (voice) {
				utterance.voice = voice;
			}

			utterance.onstart = () => {
				this.isSpeaking = true;
				if (onStart) onStart();
			};

			utterance.onend = () => {
				this.isSpeaking = false;
				if (onEnd) onEnd();
				resolve();
			};

			utterance.onerror = (event) => {
				// Ignore interruption errors as they are often intentional (flow control)
				if (event.error === "interrupted" || event.error === "canceled") {
					this.isSpeaking = false;
					this.logger?.debug("Speech synthesis interrupted (intentional).");
					resolve(); // Resolve on interruption too so flow continues
					return;
				}
				this.logger?.error("Speech synthesis error:", event);
				this.isSpeaking = false;
				if (onError) onError(event);
				resolve(); // Resolve even on error to prevent hanging await
			};

			this.#synthesis?.speak(utterance);
		});
	}

	/**
	 * Cancel all ongoing speech
	 */
	cancel() {
		if (this.#synthesis) {
			this.#synthesis.cancel();
			this.isSpeaking = false;
		}
	}

	/**
	 * Check if currently speaking
	 * @returns {boolean}
	 */
	getSpeakingStatus() {
		return this.isSpeaking;
	}
}

// Export singleton instance (will be replaced by LegacysEndApp injection in the future, but currently still needed by some files)
export const voiceSynthesisService = new VoiceSynthesisService();
