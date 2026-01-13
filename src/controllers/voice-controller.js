/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { executeVoiceAction } from "../config/voice-command-actions.js";
import {
	ALARION_TRAINING_EXAMPLES,
	getAlarionSystemPrompt,
	NPC_SYSTEM_PROMPT,
} from "../config/voice-training-prompts.js";

/**
 * @typedef {import('../services/ai-service.js').AIService} AIService
 * @typedef {import('../services/voice-synthesis-service.js').VoiceSynthesisService} VoiceSynthesisService
 */

/**
 * @typedef {Object} SpeechRecognition
 * @property {boolean} continuous
 * @property {boolean} interimResults
 * @property {string} lang
 * @property {function(): void} start
 * @property {function(): void} stop
 * @property {((event: any) => void)|null} onstart
 * @property {((event: any) => void)|null} onresult
 * @property {((event: any) => void)|null} onend
 * @property {((event: any) => void)|null} onerror
 * @property {function(): void} abort
 */

/**
 * @typedef {Object} AISession
 * @property {function(string): Promise<string>} prompt
 * @property {function(): void} destroy
 */

/**
 * @typedef {Object} SpeechRecognitionErrorEvent
 * @property {string} error
 * @property {string} message
 */

/**
 * @typedef {Object} VoiceControllerOptions
 * @property {import('../services/logger-service.js').LoggerService} logger - Logger service
 * @property {AIService} aiService - AI Service
 * @property {VoiceSynthesisService} voiceSynthesisService - Voice Synthesis Service
 * @property {(dx: number, dy: number) => void} [onMove] - Movement callback
 * @property {() => void} [onInteract] - Interaction callback
 * @property {() => void} [onPause] - Pause callback
 * @property {() => void} [onNextSlide] - Next slide callback
 * @property {() => void} [onPrevSlide] - Previous slide callback
 * @property {() => void} [onMoveToNpc] - Move to NPC callback
 * @property {() => void} [onMoveToExit] - Move to exit callback
 * @property {() => string} [onGetDialogText] - Get current dialog text
 * @property {() => {isDialogOpen: boolean, isRewardCollected: boolean}} [onGetContext] - Get game context
 * @property {(action: string, value: unknown) => void} [onDebugAction] - Debug action callback
 * @property {() => boolean} [isEnabled] - Check if voice control is enabled
 * @property {string} [language] - Language code (e.g., 'en-US', 'es-ES')
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
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {VoiceControllerOptions} options
	 */
	constructor(host, options) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;

		/** @type {VoiceControllerOptions} */
		this.options = options;

		if (!this.options.aiService)
			throw new Error("VoiceController requires aiService");
		if (!this.options.voiceSynthesisService)
			throw new Error("VoiceController requires voiceSynthesisService");

		this.aiService = this.options.aiService;
		this.voiceSynthesisService = this.options.voiceSynthesisService;

		/** @type {import('../services/logger-service.js').LoggerService} */
		this.logger = this.options.logger;

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

		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			this.recognition = new SpeechRecognition();
			this.recognition.continuous = true;
			this.recognition.interimResults = false;
			// Set language based on options
			this.recognition.lang = this.options.language || "en-US";

			this.recognition.onstart = () => {
				this.isListening = true;
				this.lastStartTime = Date.now();
				if (this.recognition) {
					this.logger.debug(
						`🎤 Voice control active (${this.recognition.lang}).`,
					);
				}
				this.host.requestUpdate();
			};

			this.recognition.onresult = (event) => this.handleResult(event);

			this.recognition.onend = () => {
				this.isListening = false;
				this.host.requestUpdate();

				// Prevent auto-restart if disabled or we are speaking
				if (this.enabled && this.options.isEnabled?.() && !this.isSpeaking) {
					const duration = Date.now() - this.lastStartTime;
					// If session lasted less than 2 seconds, assume instability
					if (duration < 2000) {
						this.restartAttempts++;
					} else {
						// Stable session, reset counter
						this.restartAttempts = 0;
					}

					// Exponential backoff: 100ms, 200ms, 400ms... max 3s
					const delay = Math.min(100 * 2 ** this.restartAttempts, 3000);
					if (this.restartAttempts > 2) {
						this.logger.debug(
							`🎤 Restarting voice in ${delay}ms (Attempt ${this.restartAttempts})`,
						);
					}
					setTimeout(() => this.start(), delay);
				} else {
					this.restartAttempts = 0;
				}
			};

			this.recognition.onerror = (event) => {
				const errorEvent = /** @type {SpeechRecognitionErrorEvent} */ (
					/** @type {unknown} */ (event)
				);
				this.logger.error(`❌ Voice recognition error: ${errorEvent.error}`);
				if (errorEvent.error === "not-allowed") {
					this.isListening = false;
					this.enabled = false; // Disable if permission denied
					this.host.requestUpdate();
				}
			};
		}

		// Initialize AI session if available
		this.initAI();

		host.addController(this);
	}

	async initAI() {
		try {
			const status = await this.aiService.checkAvailability();

			if (status === "readily" || status === "available") {
				// Create Alarion's command processing session
				await this.aiService.createSession("alarion", {
					language: this.options.language || "en-US",
					initialPrompts: [
						{
							role: "system",
							content: getAlarionSystemPrompt(this.options.language || "en-US"),
						},
						...ALARION_TRAINING_EXAMPLES,
					],
				});

				// Create NPC narration session
				await this.aiService.createSession("npc", {
					language: this.options.language || "en-US",
					initialPrompts: [
						{
							role: "system",
							content: NPC_SYSTEM_PROMPT,
						},
					],
				});

				// Get session references
				this.aiSession = this.aiService.getSession("alarion");
				this.npcSession = this.aiService.getSession("npc");

				this.logger.info(
					"🤖 Chrome Built-in AI initialized with Alarion's persona & NPC Persona.",
				);
			}
		} catch (error) {
			this.logger.warn(`⚠️ Could not initialize Built-in AI: ${error}`);
		}
	}

	/**
	 * @param {string} text
	 * @param {string|null} [lang]
	 * @param {string} [role]
	 * @param {boolean} [queue]
	 */
	speak(text, lang = null, role = "hero", queue = false) {
		this.isSpeaking = true;
		this.stop();

		const targetLang = lang || this.recognition?.lang || this.options.language;

		this.voiceSynthesisService.speak(text, {
			lang: targetLang,
			role,
			queue: queue || false, // Ensure it's explicitly false if undefined
			onStart: () => {
				this.isSpeaking = true;
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
	 * @param {string} text
	 * @param {string|null} [lang]
	 */
	async narrateDialogue(text, lang = null) {
		if (!text) return;

		let narration = text;

		// Use AI to act as the NPC and summarize/speak the text
		if (this.npcSession) {
			try {
				const targetLang = lang || this.options.language;
				const prompt = `${text} IMPORTANT: Reformulate this line for voice acting. Output MUST be in '${targetLang}'.`;
				const response = await this.npcSession.prompt(prompt);
				narration = response.replace(/```json|```/g, "").trim();
				this.logger.info(`🤖 NPC (${targetLang}): ${narration}`);
			} catch (error) {
				this.logger.error(`❌ AI Narration error: ${error}`);
			}
		}

		// Use the NPC voice for dialogue narration (queued after Alarion speaks)
		this.speak(narration, lang, "npc", true);
	}

	hostConnected() {
		// Do not auto-start
	}

	hostDisconnected() {
		this.stop();
		this.voiceSynthesisService.cancel();

		// Cleanup AI sessions via AIService
		this.aiService.destroySession("alarion");
		this.aiService.destroySession("npc");

		this.aiSession = null;
		this.npcSession = null;
	}

	start() {
		if (this.recognition && !this.isListening) {
			try {
				this.recognition.start();
				this.enabled = true;
			} catch (_e) {
				// Already started
			}
		}
	}

	stop() {
		if (this.recognition && this.isListening) {
			this.recognition.stop();
			this.isListening = false;
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

	/**
	 * @param {any} event
	 */
	handleResult(event) {
		const last = event.results.length - 1;
		const transcript = event.results[last][0].transcript.toLowerCase().trim();

		this.logger.info(
			`🗣️ Voice command [${this.recognition?.lang}]: "${transcript}"`,
		);
		this.processCommand(transcript);
	}

	/**
	 * @param {string} command
	 */
	async processCommand(command) {
		if (!this.aiSession) {
			this.logger.warn("⚠️ AI Session not available. Command ignored.");
			return;
		}

		try {
			// Inyectar contexto
			const context = this.options.onGetContext?.() || {
				isDialogOpen: false,
				isRewardCollected: false,
			};
			const targetLang = this.options.language || "en-US";
			const contextStr = `[Context: Dialog=${context.isDialogOpen ? "Open" : "Closed"}, Reward=${context.isRewardCollected ? "Collected" : "Not Collected"}]`;
			const promptWithContext = `${contextStr} User command: "${command}". IMPORTANT: The 'lang' field in JSON MUST be '${targetLang}' and 'feedback' text MUST be in '${targetLang}'.`;

			this.logger.debug(`🤖 Prompt: ${promptWithContext}`);
			const response = await this.aiSession.prompt(promptWithContext);
			const cleanedResponse = response.replace(/```json|```/g, "").trim();
			try {
				const result = JSON.parse(cleanedResponse);
				this.logger.info(`🤖 AI response: ${JSON.stringify(result)}`);

				if (result.feedback) {
					this.speak(result.feedback, result.lang);
				}

				if (result.action && result.action !== "unknown") {
					const actionLang = result.lang === "undefined" ? null : result.lang;
					this.executeAction(result.action, result.value, actionLang);
				}
			} catch (_e) {
				this.logger.warn(`⚠️ Failed to parse AI response as JSON: ${response}`);
			}
		} catch (error) {
			this.logger.error(`❌ AI processing error: ${error}`);
		}
	}

	/**
	 * @param {string} action
	 * @param {any} value
	 * @param {string|null} [lang]
	 */
	executeAction(action, value, lang = null) {
		const safeLang = lang && lang !== "undefined" ? lang : null;
		const language = safeLang || this.options.language || "en-US";
		executeVoiceAction(action, value, /** @type {any} */ (this), language);
	}

	celebrateChapter() {
		const lang = this.options.language || "en-US";
		const isEn = lang.startsWith("en");

		const phrases = isEn
			? [
					"Chapter complete! The Monolith weakens. Onward!",
					"System update successful! Let's keep going!",
					"Victory! We've reclaimed another sector of the Sovereignty!",
				]
			: [
					"¡Capítulo completado! ¡El Monolito se debilita! ¡Sigamos!",
					"¡Actualización del sistema completada! ¡Hacia el siguiente sector!",
					"¡Victoria! ¡Hemos recuperado otro sector de la Soberanía!",
				];

		const phrase = phrases[Math.floor(Math.random() * phrases.length)];
		// Queue the celebration phrase so it doesn't interrupt the AI feedback
		this.speak(phrase, lang, "hero", true);

		// Trigger the actual level completion logic
		this.options.onCompleteLevel?.();
	}

	showHelp() {
		this.logger.info(`
🎤 VOICE COMMANDS / COMANDOS DE VOZ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOVE: 'Up/Arriba', 'Down/Abajo', 'Left/Izquierda', 'Right/Derecha'
APPROACH: 'Approach/Acércate', 'Talk to/Háblale'
DIALOGUE: 'Next/Siguiente', 'Back/Atrás'
ACTIONS: 'Interact/Interactúa', 'Pause/Pausa', 'Help/Ayuda'
DEBUG: 'Chapter/Capítulo [id]', 'Item/Objeto', 'Night/Noche', 'Hub'
🤖 AI Multilingual Feedback Active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		`);
	}
}
