import { executeVoiceAction } from "../config/voice-command-actions.js";
import {
	getAlarionCommandPrompt,
	getNPCDialoguePrompt,
} from "../config/voice-training-prompts.js";

/**
 * VoiceCommandProcessor - Handles interpretation and execution of voice commands
 */
export class VoiceCommandProcessor {
	/**
	 * @param {import('./dialogue-generation-service.js').DialogueGenerationService} dialogueService
	 * @param {import('../types/services.d.js').ILoggerService} logger
	 */
	constructor(dialogueService, logger) {
		this.dialogueService = dialogueService;
		this.logger = logger;
		/** @type {string|null} */
		this.lastUserCommand = null;
	}

	/**
	 * @typedef {Object} ProcessorCallbacks
	 * @property {function(string, string|null): void} onSpeak
	 * @property {function(string, string|null): void} onNarrate
	 * @property {function(import('lit').ReactiveControllerHost, string): void} onAction
	 */

	/**
	 * Process a raw voice command
	 * @param {string} command - Raw voice input
	 * @param {import('../contexts/dialog-context.js').DialogState} context - Current dialog state
	 * @param {string} lang - Language code
	 * @param {ProcessorCallbacks} callbacks - callbacks for side effects
	 * @param {import('lit').ReactiveControllerHost} host - The host element for events
	 */
	async process(command, context, lang, callbacks, host) {
		const prompt = getAlarionCommandPrompt(command, context, lang);

		try {
			const cleanedResponse = await this.dialogueService.generate(
				"alarion",
				prompt,
				true,
			);

			if (!cleanedResponse) {
				this.logger.warn(
					"⚠️ AI response empty, falling back to regex matching.",
				);
				this._processWithRegex(command, lang, context, callbacks, host);
				return;
			}

			/** @type {{feedback: string, action: string, lang: string}} */
			const result = JSON.parse(cleanedResponse);

			if (result.feedback) {
				callbacks.onSpeak(result.feedback, result.lang);
			}

			if (result.action && result.action !== "unknown") {
				this.lastUserCommand = command;
				await this.executeAction(
					result.action,
					result.lang,
					context,
					callbacks,
					host,
				);
			}
		} catch (error) {
			this.logger.warn(
				`⚠️ AI processing failed, falling back to regex: ${error}`,
			);
			this._processWithRegex(command, lang, context, callbacks, host);
		}
	}

	/**
	 * Fallback processing using regex patterns
	 * @param {string} command
	 * @param {string} lang
	 * @param {import('../contexts/dialog-context.js').DialogState} context
	 * @param {ProcessorCallbacks} callbacks
	 * @param {import('lit').ReactiveControllerHost} host
	 */
	_processWithRegex(command, lang, context, callbacks, host) {
		const cmd = command.toLowerCase();
		let action = null;

		// Simple regex mappings
		if (/move.*up/i.test(cmd) || /arriba/i.test(cmd)) action = "move_up";
		else if (/move.*down/i.test(cmd) || /abajo/i.test(cmd))
			action = "move_down";
		else if (/move.*left/i.test(cmd) || /izquierda/i.test(cmd))
			action = "move_left";
		else if (/move.*right/i.test(cmd) || /derecha/i.test(cmd))
			action = "move_right";
		else if (/interact/i.test(cmd) || /interactuar/i.test(cmd))
			action = "interact";
		else if (/pause/i.test(cmd) || /pausa/i.test(cmd)) action = "pause";
		else if (/help/i.test(cmd) || /ayuda/i.test(cmd)) action = "help";
		else if (/next.*slide/i.test(cmd) || /siguiente/i.test(cmd))
			action = "next_slide";
		else if (/previous.*slide/i.test(cmd) || /anterior/i.test(cmd))
			action = "prev_slide";

		if (action) {
			this.logger.info(`🔄 Fallback matched action: ${action}`);
			this.lastUserCommand = command;
			this.executeAction(action, lang, context, callbacks, host);
		} else {
			this.logger.warn(`❌ No fallback match for: ${command}`);
		}
	}

	/**
	 * Execute the determined action
	 * @param {string} action
	 * @param {string} lang
	 * @param {import('../contexts/dialog-context.js').DialogState} context
	 * @param {ProcessorCallbacks} callbacks
	 * @param {import('lit').ReactiveControllerHost} host
	 */
	async executeAction(action, lang, context, callbacks, host) {
		const targetLang = lang || "en-US";

		// Handle NPC narration
		if (action === "interact") {
			const text = context.currentDialogText;
			if (text) {
				callbacks.onNarrate(text, targetLang);
			}
		}

		// Handle Slide Navigation with prefetching
		if (action === "next_slide") {
			const nextText = context.nextDialogText;
			if (nextText) {
				const prefetchPrompt = getNPCDialoguePrompt(
					nextText,
					context,
					targetLang,
					this.lastUserCommand,
				);
				this.dialogueService.prefetch("npc", prefetchPrompt);
			}
		}

		executeVoiceAction(
			action,
			/** @type {import('../config/voice-command-actions.js').VoiceActionExecutor} */ ({
				host,
				_dialogContext: context,
				logger: this.logger,
				move: (x, y) => this._emitMove(host, x, y),
				moveToNpc: () => this._emit(host, "move-to-npc"),
				moveToExit: () => this._emit(host, "move-to-exit"),
				pause: () => this._emit(host, "pause-game"),
				nextSlide: () => this._emit(host, "next-slide"),
				prevSlide: () => this._emit(host, "prev-slide"),
				interact: () => this._emit(host, "interact"),
				celebrateChapter: () =>
					this._emitNextChapter(host, callbacks, targetLang),
				showHelp: () => this._emit(host, "show-help"),
				narrateDialogue: (text, l) => callbacks.onNarrate(text, l),
			}),
			targetLang,
		);
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {ProcessorCallbacks} callbacks
	 * @param {string} lang
	 */
	_emitNextChapter(host, callbacks, lang) {
		// Logic moved from VoiceController.celebrateChapter
		// We need to pick a phrase and speak it
		// But celebrateChapter in VoiceController relied on `phrases`.
		// We might need to duplicate that logic or move it here.
		// For now, let's emit an event and let the app handle it?
		// Or assume the shim is robust enough.
		// The original code:
		/*
		const phrases = [...]
		const phrase = ...
		this.narration.speak(...)
		emit('next-chapter')
		*/

		const phrases = lang.startsWith("es")
			? [
					"¡Capítulo completado!",
					"¡Bien hecho, héroe!",
					"¡Victoria!",
					"¡Excelente trabajo!",
				]
			: [
					"Chapter complete!",
					"Well done, hero!",
					"Victory!",
					"Excellent work!",
				];

		const phrase = phrases[Math.floor(Math.random() * phrases.length)] || "";
		callbacks.onSpeak(phrase, lang);

		this._emit(host, "next-chapter");
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {string} name
	 * @param {any} [detail]
	 */
	_emit(host, name, detail) {
		/** @type {HTMLElement} */ (/** @type {unknown} */ (host)).dispatchEvent(
			new CustomEvent(name, {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}

	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {number} x
	 * @param {number} y
	 */
	_emitMove(host, x, y) {
		// This is a temporary shim. executeVoiceAction calls 'controller.move(x, y)'
		this._emit(host, "game-move", { dx: x, dy: y });
	}
}
