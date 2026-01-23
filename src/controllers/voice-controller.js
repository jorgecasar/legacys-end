/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { executeVoiceAction } from "../config/voice-command-actions.js";
import { VOICE_PROFILES } from "../config/voice-profiles.js";
import {
	ALARION_TRAINING_EXAMPLES,
	getAlarionCommandPrompt,
	getAlarionSystemPrompt,
	getNPCDialoguePrompt,
	NPC_SYSTEM_PROMPT,
} from "../config/voice-training-prompts.js";
import { DialogueGenerationService } from "../services/dialogue-generation-service.js";

/**
 * @typedef {import('../services/interfaces.js').IAIService} AIService
 * @typedef {import('../services/interfaces.js').IVoiceSynthesisService} VoiceSynthesisService
 * @typedef {Object} AISession
 * @property {function(string): Promise<string>} prompt
 * @property {function(): void} destroy
 *
 * @typedef {Object} SpeechRecognitionErrorEvent
 * @property {string} error
 * @property {string} message
 */

/**
 * @typedef {Object} VoiceContext
 * @property {boolean} isDialogOpen
 * @property {boolean} isRewardCollected
 * @property {string|null} [npcName]
 * @property {string|null} [exitZoneName]
 * @property {string|null} [chapterTitle]
 */

/**
 * @typedef {Object} VoiceControllerOptions
 * @property {import('../services/interfaces.js').ILoggerService} logger - Logger service
 * @property {AIService} aiService - AI Service
 * @property {VoiceSynthesisService} voiceSynthesisService - Voice Synthesis Service
 * @property {(dx: number, dy: number) => void} [onMove] - Movement callback
 * @property {() => Promise<void>|void} [onInteract] - Interaction callback
 * @property {() => void} [onPause] - Pause callback
 * @property {() => Promise<void>|void} [onNextSlide] - Next slide callback
 * @property {() => Promise<void>|void} [onPrevSlide] - Previous slide callback
 * @property {() => void} [onMoveToNpc] - Move to NPC callback
 * @property {() => void} [onMoveToExit] - Move to exit callback
 * @property {() => string} [onGetDialogText] - Get current dialog text
 * @property {() => string} [onGetNextDialogText] - Get next dialog text for prefetching
 * @property {() => VoiceContext} [onGetContext] - Get game context for AI
 * @property {(action: string, value: import('../services/interfaces.js').JsonValue) => void} [onDebugAction] - Debug action callback
 * @property {() => boolean} [isEnabled] - Callback to check if voice control is enabled from host
 * @property {string} [language] - Language code (e.g., 'en-US', 'es-ES')
 * @property {import('../services/interfaces.js').ILocalizationService} [localizationService] - Localization service
 * @property {() => void} [onCompleteLevel] - Complete level callback
 */

/**
 * VoiceController - Lit Reactive Controller for voice commands
 *
 * Uses the Web Speech API to listen for commands.
 * Supports English and Spanish commands.
 * Optionally uses Chrome's Built-in AI (Prompt API) for smarter command recognition.
 * Integration with SpeechSynthesis for voice feedback using Alarion's persona.
 *
 * @implements {ReactiveController}
 */
export class VoiceController {
	/**
	 * Get the current language code
	 * @returns {string}
	 */
	#getLanguage() {
		return (
			this.localizationService?.getLocale() ||
			this.options.language ||
			document.documentElement.lang ||
			"en-US"
		);
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {VoiceControllerOptions} options
	 */
	constructor(host, options) {
		this.host = host;
		this.options = options;

		if (!this.options.aiService)
			throw new Error("VoiceController requires aiService");
		if (!this.options.voiceSynthesisService)
			throw new Error("VoiceController requires voiceSynthesisService");

		this.aiService = this.options.aiService;
		this.voiceSynthesisService = this.options.voiceSynthesisService;
		this.logger = this.options.logger;
		this.localizationService = this.options.localizationService;

		/** @type {DialogueGenerationService} */
		this.dialogueService = new DialogueGenerationService(
			this.aiService,
			this.logger,
		);

		/** @type {SpeechRecognition|null} */
		this.recognition = null;
		/** @type {boolean} */
		this.isSpeaking = false;
		/** @type {AISession|null} */
		this.aiSession = null;
		/** @type {AISession|null} */
		this.npcSession = null;
		/** @type {number} */
		this.restartAttempts = 0;
		/** @type {boolean} */
		this.enabled = false;
		/** @type {number} */
		this.lastStartTime = 0;
		/** @type {string|null} */
		this.lastUserCommand = null;

		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			this.recognition = new SpeechRecognition();
			this.recognition.continuous = true;
			this.recognition.interimResults = false;
			this.recognition.lang = this.#getLanguage();

			this.recognition.onstart = () => {
				this.isListening = true;
				this.lastStartTime = Date.now();
				this.logger.debug(
					`🎤 Voice active (${this.recognition?.lang || "unknown"}).`,
				);
				this.host.requestUpdate();
			};

			this.recognition.onresult = (event) => this.handleResult(event);

			this.recognition.onend = () => {
				this.isListening = false;
				this.host.requestUpdate();

				if (this.enabled && this.options.isEnabled?.() && !this.isSpeaking) {
					if (this.recognition) this.recognition.lang = this.#getLanguage();
					const duration = Date.now() - this.lastStartTime;
					if (duration < 2000) {
						this.restartAttempts++;
					} else {
						this.restartAttempts = 0;
					}

					const delay = Math.min(100 * 2 ** this.restartAttempts, 3000);
					setTimeout(() => this.start(), delay);
				} else {
					this.restartAttempts = 0;
				}
			};

			this.recognition.onerror = (event) => {
				const errorEvent = /** @type {SpeechRecognitionErrorEvent} */ (event);
				this.logger.error(`❌ Voice recognition error: ${errorEvent.error}`);
				if (errorEvent.error === "not-allowed") {
					this.isListening = false;
					this.enabled = false;
					this.host.requestUpdate();
				}
			};
		}

		this.initAI();
		host.addController(this);
	}

	async initAI() {
		try {
			const status = await this.aiService.checkAvailability();
			if (status === "readily" || status === "available") {
				const lang = this.#getLanguage();

				// Alarion Session
				await this.aiService.createSession("alarion", {
					language: lang,
					initialPrompts: [
						{ role: "system", content: getAlarionSystemPrompt(lang) },
						...ALARION_TRAINING_EXAMPLES,
					],
				});

				// NPC Session
				await this.aiService.createSession("npc", {
					language: lang,
					initialPrompts: [{ role: "system", content: NPC_SYSTEM_PROMPT }],
				});

				this.logger.info("🤖 AI sessions initialized (Alarion & NPC).");
			}
		} catch (error) {
			this.logger.warn(`⚠️ Could not initialize AI context: ${error}`);
		}
	}

	/**
	 * Speak text using character profiles
	 * @param {string} text - Text to speak
	 * @param {string|null} [lang] - Language code
	 * @param {string} [role] - 'hero' or 'npc'
	 * @param {boolean} [queue] - Whether to queue
	 * @param {() => void} [onSpeakStart] - Callback when speech actually starts
	 * @returns {Promise<void>}
	 */
	async speak(
		text,
		lang = null,
		role = "hero",
		queue = false,
		onSpeakStart = undefined,
	) {
		this.isSpeaking = true;
		this.stop();

		const targetLang = lang || this.#getLanguage();
		const profile = role === "npc" ? VOICE_PROFILES.npc : VOICE_PROFILES.hero;

		// Resolve voice object
		const langCode = targetLang.startsWith("es") ? "es" : "en";
		const preferredVoices = profile.preferredVoices[langCode] || [];
		const voice = this.voiceSynthesisService.getBestVoice(
			targetLang,
			preferredVoices,
		);

		// Calculate pitch with variation
		const pitch =
			profile.pitch + (Math.random() * profile.pitchVar * 2 - profile.pitchVar);

		await this.voiceSynthesisService.speak(text, {
			lang: targetLang,
			voice: voice ?? null,
			rate: profile.rate,
			pitch,
			queue: queue || false,
			onStart: () => {
				this.isSpeaking = true;
				if (onSpeakStart) onSpeakStart();
			},
			onEnd: () => {
				this.isSpeaking = false;
				setTimeout(() => {
					if (this.enabled && this.options.isEnabled?.() && !this.isSpeaking)
						this.start();
				}, 500);
			},
			onError: () => {
				this.isSpeaking = false;
				if (this.enabled && this.options.isEnabled?.()) this.start();
			},
		});
	}

	/**
	 * Summarize and narrate dialogue using NPC persona
	 * @param {string} text - The raw text to narrate
	 * @param {string|null} [lang] - Language code
	 * @returns {Promise<void>}
	 */
	async narrateDialogue(text, lang = null) {
		if (!text) return;

		const targetLang = lang || this.#getLanguage();
		const context = this.options.onGetContext?.() || {
			isDialogOpen: false,
			isRewardCollected: false,
		};
		const prompt = getNPCDialoguePrompt(
			text,
			context,
			targetLang,
			this.lastUserCommand,
		);

		const narration = await this.dialogueService.generate("npc", prompt);
		if (narration) {
			await this.speak(narration, targetLang, "npc", true);
		} else {
			// Fallback to literal narration if AI fails
			await this.speak(text, targetLang, "npc", true);
		}
	}

	hostConnected() {}

	hostDisconnected() {
		this.stop();
		this.voiceSynthesisService.cancel();
		this.aiService.destroySession("alarion");
		this.aiService.destroySession("npc");
		this.dialogueService.clearCache();
	}

	start() {
		if (this.recognition && !this.isListening) {
			try {
				this.recognition.start();
				this.enabled = true;
			} catch (_e) {}
		}
	}

	stop() {
		try {
			if (this.recognition && this.isListening) {
				this.recognition.stop();
				this.isListening = false;
			}
		} catch (e) {
			this.logger?.debug?.(`🎤 Error stopping recognition: ${e}`);
		}
	}

	toggle() {
		if (this.enabled) {
			this.enabled = false;
			this.stop();
		} else {
			this.enabled = true;
			this.start();
		}
		this.host.requestUpdate();
	}

	handleResult(/** @type {any} */ event) {
		const last = event.results.length - 1;
		const transcript = event.results[last][0].transcript.toLowerCase().trim();
		this.logger.info(`🗣️ Voice command: "${transcript}"`);
		this.processCommand(transcript).catch((err) =>
			this.logger.error(`Error processing command: ${err}`),
		);
	}

	/**
	 * Smarter command processing using DialogueGenerationService
	 * @param {string} command - Raw voice input
	 */
	async processCommand(command) {
		const lang = this.#getLanguage();
		const context = this.options.onGetContext?.() || {
			isDialogOpen: false,
			isRewardCollected: false,
		};
		const prompt = getAlarionCommandPrompt(command, context, lang);

		try {
			const cleanedResponse = await this.dialogueService.generate(
				"alarion",
				prompt,
				true,
			);
			const result = JSON.parse(cleanedResponse);

			if (result.feedback) {
				// We don't await feedback to start actions quickly if possible
				this.speak(result.feedback, result.lang);
			}

			if (result.action && result.action !== "unknown") {
				this.lastUserCommand = command; // Store for NPC context
				await this.executeAction(result.action, result.value, result.lang);
			}
		} catch (error) {
			this.logger.error(`❌ Command processing error: ${error}`);
		}
	}

	async executeAction(
		/** @type {string} */ action,
		/** @type {import('../services/interfaces.js').JsonValue} */ value,
		lang = null,
	) {
		const targetLang = lang || this.#getLanguage();

		// Handle Slide Navigation with prefetching
		if (action === "next_slide") {
			const nextText = this.options.onGetNextDialogText?.();
			if (nextText) {
				const context = this.options.onGetContext?.() || {
					isDialogOpen: false,
					isRewardCollected: false,
				};
				// Prefetch NPC response for next slide in background
				const prefetchPrompt = getNPCDialoguePrompt(
					nextText,
					context,
					targetLang,
					this.lastUserCommand,
				);
				this.dialogueService.prefetch("npc", prefetchPrompt);
			}
		}

		executeVoiceAction(action, value, this, targetLang);
	}

	/**
	 * Celebrate level completion
	 */
	async celebrateChapter() {
		const lang = this.#getLanguage();
		const isEn = lang.startsWith("en");

		const phrases = isEn
			? [
					"Commit successful! The Monolith weakens. Onward!",
					"System update successful! Data integrity restored!",
					"Victory! Another sector reclaimed from the legacy code.",
				]
			: [
					"¡Commit completado con éxito! El Monolito se debilita.",
					"¡Actualización del sistema completada! Integridad de datos restaurada.",
					"¡Victoria! Hemos recuperado otro sector del código legado.",
				];

		const phrase = phrases[Math.floor(Math.random() * phrases.length)] || "";
		await this.speak(phrase, lang, "hero", true);
		this.options.onCompleteLevel?.();
	}

	showHelp() {
		this.logger.info(`
🎤 VOICE COMMANDS:
MOVE: Up, Down, Left, Right
APPROACH: Approach, Talk to
DIALOGUE: Next, Back
ACTIONS: Interact, Pause, Help
🤖 AI Persona Active (Alarion & Keeper of Secrets)
		`);
	}
}
