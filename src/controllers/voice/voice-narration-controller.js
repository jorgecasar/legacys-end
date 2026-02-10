import { VOICE_PROFILES } from "../../config/voice-profiles.js";
import { getNPCDialoguePrompt } from "../../config/voice-training-prompts.js";

/**
 * VoiceNarrationController - Manages Speech Synthesis
 * Handles speaking, narration, and persona management.
 */
export class VoiceNarrationController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {import('../../types/services.d.js').IVoiceSynthesisService} voiceService
	 * @param {import('../../types/services.d.js').ILocalizationService | undefined} localizationService
	 */
	constructor(host, voiceService, localizationService) {
		this.host = host;
		this.voiceService = voiceService;
		this.localizationService = localizationService;

		this.isSpeaking = false;
		/** @type {string | null} */
		this.lastNarratedText = null;

		host.addController(this);
	}

	hostConnected() {}
	hostDisconnected() {
		this.cancel();
	}

	set dialogueService(service) {
		this._dialogueService = service;
	}

	/** @returns {import('../../services/dialogue-generation-service.js').DialogueGenerationService | undefined} */
	get dialogueService() {
		return this._dialogueService;
	}

	#getLanguage() {
		return (
			this.localizationService?.getLocale() ||
			document.documentElement.lang ||
			"en-US"
		);
	}

	/**
	 * Summarize and narrate dialogue using NPC persona
	 * @param {string} text - The raw text to narrate
	 * @param {string|null} [lang] - Language code
	 * @param {Object} [context] - Dialog context
	 * @param {string|null} [lastCommand] - Last user command
	 * @returns {Promise<void>}
	 */
	async narrateDialogue(text, lang = null, context = {}, lastCommand = null) {
		if (!text) return;
		if (text === this.lastNarratedText) return;
		this.lastNarratedText = text;

		const targetLang = lang || this.#getLanguage();

		let narration;
		if (this._dialogueService) {
			const prompt = getNPCDialoguePrompt(
				text,
				/** @type {any} */ (context),
				targetLang,
				lastCommand,
			);
			narration = await this._dialogueService.generate("npc", prompt);
		}

		if (narration) {
			await this.speak(narration, {
				lang: targetLang,
				role: "npc",
				queue: true,
			});
		} else {
			// Fallback to literal narration if AI fails or service missing
			await this.speak(text, { lang: targetLang, role: "npc", queue: true });
		}
	}
	/**
	 * @typedef {Object} SpeakOptions
	 * @property {string|null} [lang]
	 * @property {string} [role]
	 * @property {boolean} [queue]
	 * @property {() => void} [onStart]
	 * @property {() => void} [onEnd]
	 * @property {() => void} [onError]
	 */

	/**
	 * @param {string} text
	 * @param {SpeakOptions} [options]
	 */
	async speak(
		text,
		{ lang = null, role = "hero", queue = false, onStart, onEnd, onError } = {},
	) {
		if (!this.voiceService) return;

		// If not queuing and already speaking, we might want to cancel previous?
		// But voiceService might handle queueing. logic here matches previous controller
		// which cancels if not queueing.
		if (!queue) {
			this.cancel();
		}

		const targetLang = lang || this.#getLanguage();
		const profile = role === "npc" ? VOICE_PROFILES.npc : VOICE_PROFILES.hero;

		// Resolve voice object
		const langCode = targetLang.startsWith("es") ? "es" : "en";
		const preferredVoices = profile.preferredVoices[langCode] || [];
		const voice = this.voiceService.getBestVoice(targetLang, preferredVoices);

		// Calculate pitch with variation
		const pitch =
			profile.pitch + (Math.random() * profile.pitchVar * 2 - profile.pitchVar);

		try {
			await this.voiceService.speak(text, {
				lang: targetLang,
				voice: voice ?? null,
				rate: profile.rate,
				pitch,
				queue: queue || false,
				onStart: () => {
					this.isSpeaking = true;
					this._emit("narration-start");
					onStart?.();
					this.host.requestUpdate();
				},
				onEnd: () => {
					this.isSpeaking = false;
					this._emit("narration-end");
					onEnd?.();
					this.host.requestUpdate();
				},
				onError: () => {
					this.isSpeaking = false;
					this._emit("narration-error");
					onError?.();
					this.host.requestUpdate();
				},
			});
		} catch (error) {
			this.isSpeaking = false;
			this.host.requestUpdate();
			throw error;
		}
	}

	cancel() {
		this.voiceService?.cancel();
		this.isSpeaking = false;
		this.host.requestUpdate();
	}

	/**
	 * @param {string} name
	 * @param {any} [detail]
	 */
	_emit(name, detail = null) {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(name, {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}
}
