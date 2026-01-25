/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { ContextConsumer } from "@lit/context";
import { executeVoiceAction } from "../config/voice-command-actions.js";
import { VOICE_PROFILES } from "../config/voice-profiles.js";
import {
	ALARION_TRAINING_EXAMPLES,
	getAlarionCommandPrompt,
	getAlarionSystemPrompt,
	getNPCDialoguePrompt,
	NPC_SYSTEM_PROMPT,
} from "../config/voice-training-prompts.js";
import { aiContext } from "../contexts/ai-context.js";
import { dialogStateContext } from "../contexts/dialog-context.js";
import { localizationContext } from "../contexts/localization-context.js";
import { loggerContext } from "../contexts/logger-context.js";
import { voiceContext } from "../contexts/voice-context.js";
import { UIEvents } from "../core/events.js";
import { DialogueGenerationService } from "../services/dialogue-generation-service.js";

/**
 * @typedef {import('../services/interfaces.js').IAIService} AIService
 * @typedef {import('../services/interfaces.js').IVoiceSynthesisService} VoiceSynthesisService
 * @typedef {import('../contexts/dialog-context.js').DialogState} DialogState
 * @typedef {Object} AISession
 * @property {function(string): Promise<string>} prompt
 * @property {function(): void} destroy
 *
 * @typedef {Object} SpeechRecognitionAlternative
 * @property {string} transcript
 * @property {number} confidence
 *
 * @typedef {{ [index: number]: SpeechRecognitionAlternative, length: number, item(index: number): SpeechRecognitionAlternative, isFinal: boolean }} SpeechRecognitionResult
 *
 * @typedef {{ [index: number]: SpeechRecognitionResult, length: number, item(index: number): SpeechRecognitionResult }} SpeechRecognitionResultList
 *
 * @typedef {Object} SpeechRecognitionEvent
 * @property {SpeechRecognitionResultList} results
 *
 * @typedef {Object} SpeechRecognitionErrorEvent
 * @property {string} error
 * @property {string} message
 *
 * @typedef {Object} SpeechRecognition
 * @property {boolean} continuous
 * @property {boolean} interimResults
 * @property {string} lang
 * @property {function(): void} start
 * @property {function(): void} stop
 * @property {function(): void} abort
 * @property {((this: SpeechRecognition, ev: Event) => any) | null} onstart
 * @property {((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null} onresult
 * @property {((this: SpeechRecognition, ev: Event) => any) | null} onend
 * @property {((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null} onerror
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
	#getLanguage() {
		return (
			this.localizationService?.getLocale() ||
			document.documentElement.lang ||
			"en-US"
		);
	}

	/**
	 * Get the short language code (ISO 639-1)
	 * @returns {string}
	 */
	#getShortLanguage() {
		return this.#getLanguage().split("-")[0] || "";
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 */
	constructor(host) {
		this.host = host;

		/** @type {AIService | null} */
		this.aiService = null;
		/** @type {VoiceSynthesisService | null} */
		this.voiceSynthesisService = null;
		/** @type {import('../services/interfaces.js').ILocalizationService | null} */
		this.localizationService = null;

		/** @type {import('../services/interfaces.js').ILoggerService | undefined} */
		this.logger = undefined;

		this._aiInitialized = false;
		this.dialogueService = null;

		/** @type {DialogState} */
		this._dialogContext = {
			isDialogOpen: false,
			isRewardCollected: false,
			npcName: null,
			exitZoneName: null,
			chapterTitle: null,
			currentDialogText: null,
		};

		/** @type {SpeechRecognition | null} */
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
		/** @type {boolean} */
		this.isInitializing = false;
		/** @type {boolean} */
		this._contextsInitialized = false;
		/** @type {string|null} */
		this.lastNarratedText = null;

		host.addController(this);
	}

	initContexts() {
		if (this._contextsInitialized) return;
		this._contextsInitialized = true;

		const hostElement = /** @type {import('lit').ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Setup Context Consumers
		/** @type {ContextConsumer<typeof aiContext, import('lit').ReactiveElement>} */
		this._aiConsumer = new ContextConsumer(hostElement, {
			context: aiContext,
			subscribe: true,
			callback: (service) => {
				this.aiService = service;
				this.#updateDialogueService();
				if (
					this.aiService &&
					this.enabled &&
					!this._aiInitialized &&
					!this.isInitializing
				) {
					this.initAI();
				}
			},
		});

		/** @type {ContextConsumer<typeof localizationContext, import('lit').ReactiveElement>} */
		this._localizationConsumer = new ContextConsumer(hostElement, {
			context: localizationContext,
			subscribe: true,
			callback: (service) => {
				this.localizationService = service;
			},
		});

		/** @type {ContextConsumer<typeof loggerContext, import('lit').ReactiveElement>} */
		this._loggerConsumer = new ContextConsumer(hostElement, {
			context: loggerContext,
			subscribe: true,
			callback: (service) => {
				this.logger =
					/** @type {import('../services/interfaces.js').ILoggerService} */ (
						service
					);
				this.#updateDialogueService();
			},
		});

		/** @type {ContextConsumer<typeof dialogStateContext, import('lit').ReactiveElement>} */
		this._dialogConsumer = new ContextConsumer(hostElement, {
			context: dialogStateContext,
			subscribe: true,
			callback: (value) => {
				const state = /** @type {DialogState} */ (value);
				const oldState = this._dialogContext;
				this._dialogContext = state;

				if (state) {
					// Auto-narrate if dialog text changed and it's open
					if (
						this.enabled &&
						state.isDialogOpen &&
						state.currentDialogText &&
						state.currentDialogText !== oldState?.currentDialogText
					) {
						this.narrateDialogue(state.currentDialogText);
					}
				}
			},
		});

		/** @type {ContextConsumer<typeof voiceContext, import('lit').ReactiveElement>} */
		this._voiceConsumer = new ContextConsumer(hostElement, {
			context: voiceContext,
			subscribe: true,
			callback: (service) => {
				this.voiceSynthesisService = service;
			},
		});
	}

	#setupRecognition() {
		if (this.recognition) return;

		const SpeechRecognition =
			// @ts-expect-error
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			/** @type {SpeechRecognition} */
			const recognition = new SpeechRecognition();
			this.recognition = recognition;

			recognition.continuous = true;
			recognition.interimResults = false;
			recognition.lang = this.#getLanguage();

			recognition.onstart = () => {
				this.isListening = true;
				this.lastStartTime = Date.now();
				this.logger?.debug?.(
					`🎤 Voice active (${recognition.lang || "unknown"}).`,
				);
				this.host.requestUpdate();
			};

			recognition.onresult = (/** @type {SpeechRecognitionEvent} */ event) =>
				this.handleResult(event);

			recognition.onend = () => {
				this.isListening = false;
				this.host.requestUpdate();

				if (this.enabled && !this.isSpeaking) {
					recognition.lang = this.#getLanguage();
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

			recognition.onerror = (
				/** @type {SpeechRecognitionErrorEvent} */ event,
			) => {
				const errorEvent = /** @type {SpeechRecognitionErrorEvent} */ (event);
				this.logger?.error?.(`❌ Voice recognition error: ${errorEvent.error}`);
				if (errorEvent.error === "not-allowed") {
					this.isListening = false;
					this.enabled = false;
					this.host.requestUpdate();
				}
			};
		}
	}

	hostConnected() {}

	hostDisconnected() {
		this.stop();
		this.voiceSynthesisService?.cancel();
		this.aiService?.destroySession("alarion");
		this.aiService?.destroySession("npc");
		this.dialogueService?.clearCache();
	}

	start() {
		this.initContexts();
		this.#setupRecognition();
		if (!this.recognition) return;

		this.enabled = true;

		if (this._aiInitialized) {
			if (!this.isListening) {
				try {
					this.recognition.start();
				} catch (_e) {
					this.logger?.error?.("❌ Error starting recognition");
				}
			}
		} else {
			if (this.aiService) {
				this.initAI();
			}
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

	async toggle() {
		this.initContexts();

		if (this.enabled) {
			this.enabled = false;
			this.stop();
		} else {
			this.enabled = true;
			await this.initAI();
			this.start();
		}
		this.host.requestUpdate();
	}

	handleResult(/** @type {SpeechRecognitionEvent} */ event) {
		const last = event.results.length - 1;
		if (last < 0) return;

		const result = event.results[last];
		if (!result || !result[0]) return;

		const transcript = result[0].transcript.toLowerCase().trim();
		this.logger?.info?.(`🗣️ Voice command: "${transcript}"`);
		this.processCommand(transcript).catch((err) =>
			this.logger?.error?.(`Error processing command: ${err}`),
		);
	}

	/**
	 * Smarter command processing using DialogueGenerationService
	 * @param {string} command - Raw voice input
	 */
	async processCommand(command) {
		const lang = this.#getLanguage();
		const context = this._dialogContext;
		const prompt = getAlarionCommandPrompt(command, context, lang);

		try {
			const cleanedResponse = await this.dialogueService?.generate(
				"alarion",
				prompt,
				true,
			);
			if (!cleanedResponse) return;
			const result = JSON.parse(cleanedResponse);

			if (result.feedback) {
				// We don't await feedback to start actions quickly if possible
				this.speak(result.feedback, result.lang);
			}

			if (result.action && result.action !== "unknown") {
				this.lastUserCommand = command; // Store for NPC context
				await this.executeAction(result.action, result.lang);
			}
		} catch (error) {
			this.logger?.error?.(`❌ Command processing error: ${error}`);
		}
	}

	async executeAction(/** @type {string} */ action, lang = null) {
		const targetLang = lang || this.#getLanguage();

		// Handle NPC narration if the host provides context
		if (action === "interact") {
			const text = this._dialogContext.currentDialogText;
			if (text) {
				await this.narrateDialogue(text, targetLang);
			}
		}

		// Handle Slide Navigation with prefetching
		if (action === "next_slide") {
			const nextText = this._dialogContext.nextDialogText;
			if (nextText) {
				const context = this._dialogContext;
				// Prefetch NPC response for next slide in background
				const prefetchPrompt = getNPCDialoguePrompt(
					nextText,
					context,
					targetLang,
					this.lastUserCommand,
				);
				this.dialogueService?.prefetch("npc", prefetchPrompt);
			}
		}

		executeVoiceAction(action, this, targetLang);
	}

	async initAI() {
		if (this._aiInitialized || this.isInitializing) return;
		this.isInitializing = true;
		this.host.requestUpdate();

		try {
			if (!this.aiService) {
				throw new Error("AI Service not available");
			}

			const status = await this.aiService.checkAvailability();
			if (status === "readily" || status === "available") {
				const lang = this.#getLanguage();
				const shortLang = this.#getShortLanguage();

				// Create sessions in parallel
				await Promise.all([
					this.aiService.createSession("alarion", {
						language: shortLang,
						initialPrompts: [
							{ role: "system", content: getAlarionSystemPrompt(lang) },
							...ALARION_TRAINING_EXAMPLES,
						],
					}),
					this.aiService.createSession("npc", {
						language: shortLang,
						initialPrompts: [{ role: "system", content: NPC_SYSTEM_PROMPT }],
					}),
				]);

				this.logger?.info("🤖 AI sessions initialized (Alarion & NPC).");
				this._aiInitialized = true;

				// Start listening if enabled
				if (this.enabled && !this.isListening && this.recognition) {
					this.recognition.start();
				}
			}
		} catch (error) {
			this.logger?.warn(`⚠️ Could not initialize AI context: ${error}`);
			this.enabled = false; // Disable if initialization fails
		} finally {
			this.isInitializing = false;
			this.host.requestUpdate();
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
		if (!this.voiceSynthesisService) return;
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
					if (this.enabled && !this.isSpeaking) this.start();
				}, 500);
			},
			onError: () => {
				this.isSpeaking = false;
				if (this.enabled) this.start();
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
		if (text === this.lastNarratedText) return;
		this.lastNarratedText = text;

		const targetLang = lang || this.#getLanguage();
		const context = this._dialogContext;
		const prompt = getNPCDialoguePrompt(
			text,
			context,
			targetLang,
			this.lastUserCommand,
		);

		const narration = await this.dialogueService?.generate("npc", prompt);
		if (narration) {
			await this.speak(narration, targetLang, "npc", true);
		} else {
			// Fallback to literal narration if AI fails
			await this.speak(text, targetLang, "npc", true);
		}
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
		/** @type {import('lit').ReactiveElement} */ (this.host).dispatchEvent(
			new CustomEvent("next-chapter", {
				bubbles: true,
				composed: true,
			}),
		);
	}

	showHelp() {
		this.logger?.info?.(`
🎤 VOICE COMMANDS:
MOVE: Up, Down, Left, Right
APPROACH: Approach, Talk to
DIALOGUE: Next, Back
ACTIONS: Interact, Pause, Help
🤖 AI Persona Active (Alarion & Keeper of Secrets)
		`);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	move(x, y) {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.MOVE, {
				detail: { dx: x, dy: y },
				bubbles: true,
				composed: true,
			}),
		);
	}

	moveToNpc() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.MOVE_TO_NPC, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	moveToExit() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.MOVE_TO_EXIT, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	pause() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.TOGGLE_PAUSE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	nextSlide() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.NEXT_SLIDE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	prevSlide() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.PREV_SLIDE, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	interact() {
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).dispatchEvent(
			new CustomEvent(UIEvents.INTERACT, {
				bubbles: true,
				composed: true,
			}),
		);
	}

	#updateDialogueService() {
		if (this.aiService && this.logger) {
			this.dialogueService = new DialogueGenerationService(
				this.aiService,
				/** @type {import('../services/interfaces.js').ILoggerService} */ (
					this.logger
				),
			);
		}
	}
}
