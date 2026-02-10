/**
 * VoiceRecognitionController - Manages Speech Recognition
 * Handles listening state, errors, and emitting transcript results.
 */
export class VoiceRecognitionController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {import('../../types/services.d.js').ILoggerService} logger
	 * @param {import('../../types/services.d.js').ILocalizationService | undefined} localizationService
	 */
	constructor(host, logger, localizationService) {
		this.host = host;
		this.logger = logger;
		this.localizationService = localizationService;

		/** @type {SpeechRecognition | null} */
		this.recognition = null;
		this.isListening = false;
		this.isEnabled = false;
		this.lastStartTime = 0;
		this.restartAttempts = 0;
		this.isPausedForSpeaking = false;

		host.addController(this);
	}

	hostConnected() {
		this.#setupRecognition();
	}

	hostDisconnected() {
		this.stop();
	}

	#getLanguage() {
		return (
			this.localizationService?.getLocale() ||
			document.documentElement.lang ||
			"en-US"
		);
	}

	#setupRecognition() {
		if (this.recognition) return;

		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognition) {
			this.logger?.warn("⚠️ SpeechRecognition not supported in this browser.");
			return;
		}

		const recognition = new SpeechRecognition();
		this.recognition = recognition;

		recognition.continuous = true;
		recognition.interimResults = false;
		recognition.lang = this.#getLanguage();

		recognition.onstart = () => {
			this.isListening = true;
			this.lastStartTime = Date.now();
			this.logger?.debug(`🎤 Voice active (${recognition.lang || "unknown"}).`);
			this._emit("voice-start");
			this.host.requestUpdate();
		};

		recognition.onresult = (/** @type {SpeechRecognitionEvent} */ event) => {
			const last = event.results.length - 1;
			if (last < 0) return;

			const result = event.results[last];
			if (!result || !result[0]) return;

			const transcript = result[0].transcript.toLowerCase().trim();
			this.logger?.info(`🗣️ Recognized: "${transcript}"`);
			this._emit("voice-result", transcript);
		};

		recognition.onend = () => {
			this.isListening = false;
			this._emit("voice-end");
			this.host.requestUpdate();
			this.#handleAutoRestart();
		};

		recognition.onerror = (event) => {
			this.#handleError(event);
		};
	}

	/**
	 * @param {SpeechSynthesisErrorEvent|Event|any} event
	 */
	#handleError(event) {
		const error = event.error;

		if (error === "no-speech") {
			// Common error, just log debug and let auto-restart handle it
			this.logger?.debug("🎤 No speech detected.");
		} else if (error === "aborted") {
			this.logger?.debug("🎤 Recognition aborted.");
		} else if (error === "not-allowed") {
			this.logger?.error("❌ Voice recognition not allowed.");
			this.isEnabled = false;
			this.host.requestUpdate();
		} else if (error === "network") {
			this.logger?.warn("⚠️ Voice recognition network error.");
		} else {
			this.logger?.error(`❌ Voice recognition error: ${error}`);
		}

		this._emit("voice-error", error);
	}

	#handleAutoRestart() {
		if (this.isEnabled && !this.isPausedForSpeaking) {
			// Update language in case it changed
			if (this.recognition) {
				this.recognition.lang = this.#getLanguage();
			}

			const duration = Date.now() - this.lastStartTime;
			if (duration < 2000) {
				this.restartAttempts++;
			} else {
				this.restartAttempts = 0;
			}

			// Exponential backoff for restarts
			const delay = Math.min(100 * 2 ** this.restartAttempts, 3000);
			setTimeout(() => {
				if (this.isEnabled && !this.isPausedForSpeaking) {
					this.start();
				}
			}, delay);
		} else {
			this.restartAttempts = 0;
		}
	}

	start() {
		this.#setupRecognition();
		if (!this.recognition) return;

		this.isEnabled = true;
		this.isPausedForSpeaking = false;

		if (!this.isListening) {
			try {
				this.recognition.start();
			} catch (_e) {
				// Ignore if already started
				this.logger?.debug(
					"🎤 Recognition start called while active/starting.",
				);
			}
		}
	}

	stop() {
		this.isEnabled = false;
		this.#stopRecognition();
	}

	pause() {
		// Pause for narration (doesn't disable the feature, just stops listening momentarily)
		this.isPausedForSpeaking = true;
		this.#stopRecognition();
	}

	resume() {
		this.isPausedForSpeaking = false;
		if (this.isEnabled) {
			this.start();
		}
	}

	#stopRecognition() {
		try {
			if (this.recognition && this.isListening) {
				this.recognition.stop();
			}
		} catch (e) {
			this.logger?.debug(`🎤 Error stopping recognition: ${e}`);
		}
	}

	toggle() {
		if (this.isEnabled) {
			this.stop();
		} else {
			this.start();
		}
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
