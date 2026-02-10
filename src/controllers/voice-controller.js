/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { ContextConsumer } from "@lit/context";
import {
	ALARION_TRAINING_EXAMPLES,
	getAlarionSystemPrompt,
	NPC_SYSTEM_PROMPT,
} from "../config/voice-training-prompts.js";
import { aiContext } from "../contexts/ai-context.js";
import { dialogStateContext } from "../contexts/dialog-context.js";
import { localizationContext } from "../contexts/localization-context.js";
import { loggerContext } from "../contexts/logger-context.js";
import { voiceContext } from "../contexts/voice-context.js";
import { VoiceCommandProcessor } from "../services/voice-command-processor.js";
import { VoiceNarrationController } from "./voice/voice-narration-controller.js";
import { VoiceRecognitionController } from "./voice/voice-recognition-controller.js";

/**
 * @typedef {import('../types/services.d.js').IAIService} IAIService
 * @typedef {import('../types/services.d.js').IVoiceSynthesisService} IVoiceSynthesisService
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../contexts/dialog-context.js').DialogState} DialogState
 */

/**
 * VoiceController - Coordinator for voice interactions
 * Orchestrates Recognition, Narration, and Command Processing.
 *
 * @implements {ReactiveController}
 */
export class VoiceController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 */
	constructor(host) {
		this.host = host;

		// Services
		/** @type {IAIService | null} */
		this.aiService = null;
		/** @type {IVoiceSynthesisService | null} */
		this.voiceSynthesisService = null;
		/** @type {import('../types/services.d.js').ILocalizationService | null} */
		this.localizationService = null;
		/** @type {ILoggerService | undefined} */
		this.logger = undefined;
		/** @type {import('../services/dialogue-generation-service.js').DialogueGenerationService | null} */
		this.dialogueService = null;

		// State
		this.enabled = false;
		this.isInitializing = false;
		this._aiInitialized = false;
		this._contextsInitialized = false;

		/** @type {DialogState} */
		this._dialogContext = {
			isDialogOpen: false,
			isRewardCollected: false,
			npcName: null,
			exitZoneName: null,
			chapterTitle: null,
			currentDialogText: null,
			nextDialogText: null,
		};

		// Sub-controllers
		// We initialize them partially, dependencies are injected via contexts later
		this.recognition = new VoiceRecognitionController(
			host,
			/** @type {any} */ (null),
			undefined,
		);
		this.narration = new VoiceNarrationController(
			host,
			/** @type {any} */ (null),
			undefined,
		);
		this.commandProcessor = null;

		host.addController(this);
	}

	hostConnected() {
		// Event listeners for coordination
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).addEventListener("voice-result", (e) =>
			this.#handleVoiceResult(/** @type {CustomEvent} */ (e)),
		);
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).addEventListener("narration-start", () => this.#handleNarrationStart());
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).addEventListener("narration-end", () => this.#handleNarrationEnd());
		/** @type {HTMLElement} */ (
			/** @type {unknown} */ (this.host)
		).addEventListener("narration-error", () => this.#handleNarrationEnd());
	}

	hostDisconnected() {
		this.stop();
		this.aiService?.destroySession("alarion");
		this.aiService?.destroySession("npc");
	}

	/**
	 * Initialize context consumers
	 */
	initContexts() {
		if (this._contextsInitialized) return;
		this._contextsInitialized = true;

		const hostElement = /** @type {import('lit').ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// AI Context
		new ContextConsumer(hostElement, {
			context: aiContext,
			subscribe: true,
			callback: (service) => {
				this.aiService = service;
				this.#updateServices();
				if (
					service &&
					this.enabled &&
					!this._aiInitialized &&
					!this.isInitializing
				) {
					this.initAI();
				}
			},
		});

		// Localization Context
		new ContextConsumer(hostElement, {
			context: localizationContext,
			subscribe: true,
			callback: (service) => {
				this.localizationService = service;
				this.recognition.localizationService = service;
				this.narration.localizationService = service;
			},
		});

		// Logger Context
		new ContextConsumer(hostElement, {
			context: loggerContext,
			subscribe: true,
			callback: (service) => {
				this.logger = /** @type {ILoggerService} */ (service);
				this.recognition.logger = /** @type {ILoggerService} */ (service);
				this.#updateServices();
			},
		});

		// Voice Context
		new ContextConsumer(hostElement, {
			context: voiceContext,
			subscribe: true,
			callback: (service) => {
				this.voiceSynthesisService = service;
				this.narration.voiceService = service;
			},
		});

		// Dialog Context
		new ContextConsumer(hostElement, {
			context: dialogStateContext,
			subscribe: true,
			callback: (state) => {
				const oldState = this._dialogContext;
				this._dialogContext = state || {};

				if (state) {
					// Auto-narrate if dialog text changed and it's open
					if (
						this.enabled &&
						state.isDialogOpen &&
						state.currentDialogText &&
						state.currentDialogText !== oldState?.currentDialogText
					) {
						this.narration.narrateDialogue(state.currentDialogText);
					}
				}
			},
		});
	}

	#updateServices() {
		// We can get DialogueGenerationService from context in the future (Issue #16 requirement)
		// For now, we instantiate it here if we have AI and Logger, OR we use the one provided via context (TODO)
		// The plan said: "Provide DialogueGenerationService via context instead of manual instantiation."
		// So we should consume it. But for now, faithfully reproducing logic:
		// Actually, I should update BootstrapService to provide it, and consume it here.
		// For this step I'll assume context is not yet ready and lazily create it if missing,
		// BUT wait, I need to modify BootstrapService first to offer it.
		// As I am refactoring VoiceController NOW, I'll temporarily keep manual instantiation
		// but prepared for injection.

		// Note `dialogueService` IS NOT YET IN CONTEXT in the current code state.
		// I will instantiate it manually here as before, and update it later when I do `BootstrapService`.
		if (this.aiService && this.logger && !this.dialogueService) {
			// Circular dependency check: DialogueGenerationService is imported? Yes.
			// However, in the old code it was imported.
			// I need to import it.
			import("../services/dialogue-generation-service.js").then(
				({ DialogueGenerationService }) => {
					this.dialogueService = new DialogueGenerationService(
						/** @type {any} */ (this.aiService),
						/** @type {ILoggerService} */ (this.logger),
					);
					this.narration.dialogueService = this.dialogueService;
					this.commandProcessor = new VoiceCommandProcessor(
						this.dialogueService,
						/** @type {ILoggerService} */ (this.logger),
					);
				},
			);
		}
	}

	// Wrapper methods for backward compatibility / API
	async initAI() {
		if (this._aiInitialized || this.isInitializing) return;
		this.isInitializing = true;
		this.host.requestUpdate();

		try {
			if (!this.aiService) throw new Error("AI Service not available");

			const status = await this.aiService.checkAvailability();
			if (status === "readily" || status === "available") {
				const lang = this.#getLanguage();
				const shortLang = lang.split("-")[0];

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

				this.logger?.info("🤖 AI sessions initialized.");
				this._aiInitialized = true;

				if (this.enabled) {
					this.recognition.start();
				}
			}
		} catch (error) {
			this.logger?.warn(`⚠️ Could not initialize AI context: ${error}`);
			this.enabled = false;
		} finally {
			this.isInitializing = false;
			this.host.requestUpdate();
		}
	}

	start() {
		this.initContexts();
		this.enabled = true;
		if (this._aiInitialized) {
			this.recognition.start();
		} else if (this.aiService) {
			this.initAI();
		}
	}

	stop() {
		this.enabled = false;
		this.recognition.stop();
		this.narration.cancel();
	}

	async toggle() {
		this.initContexts();
		if (this.enabled) {
			this.stop();
		} else {
			this.start();
		}
		this.host.requestUpdate();
	}

	#getLanguage() {
		return (
			this.localizationService?.getLocale() ||
			document.documentElement.lang ||
			"en-US"
		);
	}

	// Event Handlers
	/** @param {CustomEvent} e */
	#handleVoiceResult(e) {
		const transcript = e.detail;
		if (this.commandProcessor) {
			this.commandProcessor.process(
				transcript,
				this._dialogContext,
				this.#getLanguage(),
				{
					onSpeak: (text, lang) =>
						this.narration.speak(text, { lang: lang ?? null }),
					onNarrate: (text, lang) =>
						this.narration.narrateDialogue(text, lang ?? null),
					onAction: (_host, _action) => {
						/* Handled by processor logic calling executeVoiceAction */
					},
				},
				this.host,
			);
		}
	}

	#handleNarrationStart() {
		this.logger?.debug("🔇 Pausing recognition for narration");
		this.recognition.pause();
	}

	#handleNarrationEnd() {
		if (this.enabled) {
			this.logger?.debug("👂 Resuming recognition after narration");
			this.recognition.resume();
		}
	}

	// Expose for compatibility if needed, or remove if not used externally
	/**
	 * @param {string} text
	 * @param {any[]} args
	 */
	speak(text, ...args) {
		return this.narration.speak(text, ...args);
	}

	/**
	 * @param {string} text
	 * @param {string|null} [lang]
	 */
	narrateDialogue(text, lang = null) {
		return this.narration.narrateDialogue(text, lang);
	}

	celebrateChapter() {
		// Reimplement locally or move to processor?
		// It was a method on controller.
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
		this.narration.speak(phrase, {
			lang: lang ?? null,
			role: "hero",
			queue: true,
		});

		/** @type {import('lit').ReactiveElement} */ (this.host).dispatchEvent(
			new CustomEvent("next-chapter", {
				bubbles: true,
				composed: true,
			}),
		);
	}
}
