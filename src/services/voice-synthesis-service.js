import { logger } from "./logger-service.js";

/**
 * VoiceSynthesisService - Manages text-to-speech synthesis
 *
 * Handles voice selection, speech synthesis, and character voice profiles.
 * Provides a reusable service for voice output across the application.
 */
export class VoiceSynthesisService {
	constructor() {
		/** @type {SpeechSynthesis} */
		this.synthesis = window.speechSynthesis;

		/** @type {SpeechSynthesisVoice[]} */
		this.voices = [];

		/** @type {boolean} */
		this.isSpeaking = false;

		// Load voices when available
		if (this.synthesis) {
			this.voices = this.synthesis.getVoices();
			this.synthesis.onvoiceschanged = () => {
				this.voices = this.synthesis.getVoices();
			};
		}
	}

	/**
	 * Get the best voice for a given language and role
	 * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
	 * @param {string} role - Character role ('hero' or 'npc')
	 * @returns {SpeechSynthesisVoice|null}
	 */
	getBestVoice(lang, role = "hero") {
		if (!this.voices.length) return null;

		// Normalize lang (e.g., 'es' -> 'es-ES')
		const searchLang = lang.startsWith("es") ? "es" : "en";

		// Voice preferences by language and role
		// NPCs can be male or female - we provide both options and let the system pick
		const preferredVoices =
			{
				en:
					role === "hero"
						? ["Google US English", "Daniel", "Alex", "Fred", "Rishi"] // Male Hero
						: [
							// NPCs - mix of male and female voices
							"Google UK English Female",
							"Samantha",
							"Victoria",
							"Karen",
							"Google US English",
							"Daniel",
							"Alex",
						],
				es:
					role === "hero"
						? ["Google español", "Jorge", "Diego", "Carlos", "Pablo"] // Male Hero
						: [
							// NPCs - mix of male and female voices
							"Mónica",
							"Paulina",
							"Soledad",
							"Angelica",
							"Jorge",
							"Diego",
						],
			}[searchLang] || [];

		// Filter by language and look for premium versions
		const langVoices = this.voices
			.filter((v) => v.lang.toLowerCase().startsWith(searchLang))
			.sort((a, b) => {
				// Prioritize voices that sound more natural (heuristics)
				const aScore =
					(a.name.includes("Natural") ? 2 : 0) +
					(a.name.includes("Enhanced") ? 1 : 0);
				const bScore =
					(b.name.includes("Natural") ? 2 : 0) +
					(b.name.includes("Enhanced") ? 1 : 0);
				return bScore - aScore;
			});

		if (langVoices.length === 0) return null;

		// Try to find a role-specific preferred voice
		for (const name of preferredVoices) {
			const found = langVoices.find((v) => v.name.includes(name));
			if (found) return found;
		}

		// If no preferred, at least try to pick different ones for hero/npc if multiple available
		if (role === "npc" && langVoices.length > 1) return langVoices[1];

		return langVoices[0];
	}

	/**
	 * Speak text with voice synthesis
	 * @param {string} text - Text to speak
	 * @param {Object} options - Speech options
	 * @param {string} [options.lang] - Language code
	 * @param {string} [options.role] - Character role ('hero' or 'npc')
	 * @param {boolean} [options.queue] - Whether to queue or interrupt current speech
	 * @param {() => void} [options.onStart] - Callback when speech starts
	 * @param {() => void} [options.onEnd] - Callback when speech ends
	 * @param {(event: any) => void} [options.onError] - Callback on error
	 */
	speak(text, options = {}) {
		// Validate text parameter
		if (!text || typeof text !== "string") {
			logger.warn("VoiceSynthesisService.speak: Invalid or empty text");
			return;
		}

		if (!this.synthesis) {
			logger.warn("VoiceSynthesisService.speak: Speech synthesis not available");
			return;
		}

		const {
			lang = "en-US",
			role = "hero",
			queue = false,
			onStart,
			onEnd,
			onError,
		} = options;

		this.isSpeaking = true;

		if (!queue) {
			this.synthesis.cancel();
		}

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = lang;

		// Select best voice if available for this specific role
		const voice = this.getBestVoice(lang, role);
		if (voice) {
			utterance.voice = voice;
		}

		// Character Voice Profiles
		if (role === "hero") {
			// Alarion (The Hero): Faster, energetic, slightly higher pitch for bravery
			utterance.rate = 1.1;
			// Add a tiny bit of random variation so it feels less robotic over time
			utterance.pitch = 1.05 + (Math.random() * 0.1 - 0.05);
		} else {
			// NPCs (The Guides): Slower, wiser, deeper pitch
			utterance.rate = 0.85;
			utterance.pitch = 0.85 + (Math.random() * 0.06 - 0.03);
		}

		utterance.onstart = () => {
			this.isSpeaking = true;
			if (onStart) onStart();
		};

		utterance.onend = () => {
			this.isSpeaking = false;
			if (onEnd) onEnd();
		};

		utterance.onerror = (event) => {
			logger.error("Speech synthesis error:", event);
			this.isSpeaking = false;
			if (onError) onError(event);
		};

		this.synthesis.speak(utterance);
	}

	/**
	 * Cancel all ongoing speech
	 */
	cancel() {
		if (this.synthesis) {
			this.synthesis.cancel();
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

// Export singleton instance
export const voiceSynthesisService = new VoiceSynthesisService();
