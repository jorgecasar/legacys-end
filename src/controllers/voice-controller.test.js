import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock voiceSynthesisService BEFORE importing VoiceController
vi.mock("../services/voice-synthesis-service.js", () => ({
	voiceSynthesisService: {
		speak: vi.fn(),
		cancel: vi.fn(),
		getBestVoice: vi.fn(),
		getSpeakingStatus: vi.fn().mockReturnValue(false),
	},
}));

import { aiService } from "../services/ai-service.js";
import { voiceSynthesisService } from "../services/voice-synthesis-service.js";
import { VoiceController } from "./voice-controller.js";

describe("VoiceController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {VoiceController} */
	let controller;
	/** @type {import("vitest").Mock} */
	let onMove;
	/** @type {import("vitest").Mock} */
	let onInteract;
	/** @type {import("vitest").Mock} */
	let onPause;
	/** @type {import("vitest").Mock} */
	let onNextSlide;
	/** @type {import("vitest").Mock} */
	let onPrevSlide;
	/** @type {import("vitest").Mock} */
	let onMoveToNpc;
	/** @type {import("vitest").Mock} */
	let onMoveToExit;
	/** @type {import("vitest").Mock} */
	let onGetDialogText;
	/** @type {import("vitest").Mock} */
	let onGetContext;
	/** @type {import("vitest").Mock} */
	let onDebugAction;
	/** @type {import("vitest").Mock} */
	let isEnabled;
	/** @type {any} */
	let options;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
		onMove = vi.fn();
		onInteract = vi.fn();
		onPause = vi.fn();
		onNextSlide = vi.fn();
		onPrevSlide = vi.fn();
		onMoveToNpc = vi.fn();
		onMoveToExit = vi.fn();
		onGetDialogText = vi.fn().mockReturnValue("Test dialog text");
		onGetContext = vi
			.fn()
			.mockReturnValue({ isDialogOpen: false, isRewardCollected: false });
		onDebugAction = vi.fn();
		isEnabled = vi.fn().mockReturnValue(true);

		options = {
			onMove,
			onInteract,
			onPause,
			onNextSlide,
			onPrevSlide,
			onMoveToNpc,
			onMoveToExit,
			onGetDialogText,
			onGetContext,
			onDebugAction,
			isEnabled,
			language: "en-US",
		};

		// Mock SpeechRecognition
		class SpeechRecognitionMock {
			constructor() {
				this.continuous = false;
				this.interimResults = false;
				this.onstart = null;
				this.onresult = null;
				this.onend = null;
				this.onerror = null;
				this.start = vi.fn();
				this.stop = vi.fn();
				this.addEventListener = vi.fn();
				this.removeEventListener = vi.fn();
				this.lang = "en-US";
			}
		}
		vi.stubGlobal("SpeechRecognition", SpeechRecognitionMock);
		vi.stubGlobal("webkitSpeechRecognition", SpeechRecognitionMock);

		// Mock speechSynthesis (still needed for voice-controller internals)
		const speechSynthesisMock = {
			speak: vi.fn(),
			cancel: vi.fn(),
			getVoices: vi.fn().mockReturnValue([]),
			onvoiceschanged: /** @type {any} */ (null),
		};
		vi.stubGlobal("speechSynthesis", speechSynthesisMock);

		function SpeechSynthesisUtteranceMock(/** @type {string} */ text) {
			this.text = text;
			this.lang = "";
			this.rate = 1;
			this.pitch = 1;
			this.onstart = null;
			this.onend = null;
			this.onerror = null;
		}
		vi.stubGlobal("SpeechSynthesisUtterance", SpeechSynthesisUtteranceMock);

		// Mock LanguageModel
		const LanguageModelMock = {
			availability: vi.fn().mockResolvedValue("unavailable"),
			create: vi.fn(),
		};
		vi.stubGlobal("LanguageModel", LanguageModelMock);

		controller = new VoiceController(host, options);
	});

	it("should initialize and add controller to host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("processCommand", () => {
		it("should inject context into AI prompt", async () => {
			controller.aiSession = {
				prompt: vi.fn().mockResolvedValue("{}"),
				destroy: vi.fn(),
			};
			await controller.processCommand("next");
			expect(controller.aiSession.prompt).toHaveBeenCalledWith(
				expect.stringContaining(
					"[Context: Dialog=Closed, Reward=Not Collected]",
				),
			);
		});
	});

	describe("executeAction", () => {
		it("should handle 'move_to_npc'", () => {
			controller.executeAction("move_to_npc", null);
			expect(options.onMoveToNpc).toHaveBeenCalled();
		});

		it("should handle 'move_to_exit'", () => {
			controller.executeAction("move_to_exit", null);
			expect(options.onMoveToExit).toHaveBeenCalled();
		});

		it("should handle 'interact' and speak dialog text", async () => {
			vi.useFakeTimers();
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);

			controller.executeAction("interact", null, "en-US");
			vi.advanceTimersByTime(400); // 400ms delay in executeAction
			expect(options.onGetDialogText).toHaveBeenCalled();
			expect(voiceSynthesisService.speak).toHaveBeenCalled();
			vi.useRealTimers();
		});
	});

	describe("speak", () => {
		beforeEach(async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);
			vi.clearAllMocks();
			/** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mockClear();
		});

		it("should stop recognition before speaking", () => {
			const stopSpy = vi.spyOn(controller, "stop");
			controller.speak("Hello");
			expect(stopSpy).toHaveBeenCalled();
			expect(controller.isSpeaking).toBe(true);
		});

		it("should cancel synthesis if queue is false (default)", async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);

			controller.speak("Hello");
			expect(voiceSynthesisService.speak).toHaveBeenCalled();
			// Verify queue parameter is false (default)
			const callArgs = /** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mock.calls[0];
			expect(callArgs[1].queue).toBe(false);
		});

		it("should NOT cancel synthesis if queue is true", async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);

			controller.speak("Hello", null, "hero", true);
			expect(voiceSynthesisService.speak).toHaveBeenCalled();
			// Verify queue parameter is true
			const callArgs = /** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mock.calls[0];
			expect(callArgs[1].queue).toBe(true);
		});
	});

	describe("narrateDialogue", () => {
		it("should narrate dialogue using NPC session", async () => {
			const promptSpy = vi.fn().mockResolvedValue("Narrated text");
			controller.npcSession = { prompt: promptSpy, destroy: vi.fn() };

			await controller.narrateDialogue("Original text");

			expect(promptSpy).toHaveBeenCalledWith(
				"Original text IMPORTANT: Reformulate this line for voice acting. Output MUST be in 'en-US'.",
			);
			// Check that it queues the speech
			// Since we mocked speak, we can't check internal call, but we can verify prompt usage
		});
	});

	describe("Lifecycle", () => {
		it("should start recognition when start() is called", () => {
			controller.start();
			expect(controller.recognition?.start).toHaveBeenCalled();
		});

		it("should stop recognition when stop() is called", () => {
			controller.isListening = true;
			controller.stop();
			expect(controller.recognition?.stop).toHaveBeenCalled();
			expect(controller.isListening).toBe(false);
		});

		it("should not start if already listening", () => {
			controller.isListening = true;
			controller.start();
			expect(controller.recognition?.start).not.toHaveBeenCalled();
		});
	});

	describe("Command Processing", () => {
		it("should handle movement commands", () => {
			controller.executeAction("move_up", null);
			expect(options.onMove).toHaveBeenCalledWith(0, -5);
		});

		it("should handle move_down command", () => {
			controller.executeAction("move_down", null);
			expect(options.onMove).toHaveBeenCalledWith(0, 5);
		});

		it("should handle move_left command", () => {
			controller.executeAction("move_left", null);
			expect(options.onMove).toHaveBeenCalledWith(-5, 0);
		});

		it("should handle move_right command", () => {
			controller.executeAction("move_right", null);
			expect(options.onMove).toHaveBeenCalledWith(5, 0);
		});

		it("should handle pause command", () => {
			controller.executeAction("pause", null);
			expect(options.onPause).toHaveBeenCalled();
		});

		it("should handle next_slide command", () => {
			controller.executeAction("next_slide", null);
			expect(options.onNextSlide).toHaveBeenCalled();
		});

		it("should handle prev_slide command", () => {
			controller.executeAction("prev_slide", null);
			expect(options.onPrevSlide).toHaveBeenCalled();
		});

		it("should handle unknown commands gracefully", () => {
			expect(() =>
				controller.executeAction("unknown_action", null),
			).not.toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should handle recognition errors gracefully", () => {
			const errorEvent = /** @type {any} */ ({ error: "network" });
			expect(() => controller.recognition?.onerror?.(errorEvent)).not.toThrow();
		});

		it("should stop listening on not-allowed error", () => {
			controller.isListening = true;
			const errorEvent = /** @type {any} */ ({ error: "not-allowed" });
			controller.recognition?.onerror?.(errorEvent);
			expect(controller.isListening).toBe(false);
		});
	});

	describe("AI Interactions", () => {
		describe("narrateDialogue", () => {
			it("should do nothing if text is empty", async () => {
				await controller.narrateDialogue("");
				expect(controller.isSpeaking).toBe(false);
			});

			it("should speak text directly if NPC session is missing", async () => {
				controller.npcSession = null;
				vi.spyOn(controller, "speak");

				await controller.narrateDialogue("Hello");

				expect(controller.speak).toHaveBeenCalledWith(
					"Hello",
					null,
					"npc",
					true,
				);
			});

			it("should use AI to rephrase text if NPC session exists", async () => {
				const mockResponse = '{"narration": "Rephrased Hello"}';
				controller.npcSession = {
					prompt: vi.fn().mockResolvedValue(mockResponse),
					destroy: vi.fn(),
				};
				vi.spyOn(controller, "speak");

				await controller.narrateDialogue("Hello");

				expect(controller.npcSession.prompt).toHaveBeenCalled();
				expect(controller.speak).toHaveBeenCalledWith(
					expect.stringContaining("Rephrased"),
					null,
					"npc",
					true,
				);
			});

			it("should handle AI errors and fallback to original text", async () => {
				controller.npcSession = {
					prompt: vi.fn().mockRejectedValue(new Error("AI Error")),
					destroy: vi.fn(),
				};
				vi.spyOn(controller, "speak");
				const consoleSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});

				await controller.narrateDialogue("Hello");

				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining("AI Narration error"),
					expect.any(Error),
				);
				// Fallback to original text
				expect(controller.speak).toHaveBeenCalledWith(
					"Hello",
					null,
					"npc",
					true,
				);
				consoleSpy.mockRestore();
			});
		});

		describe("processCommand", () => {
			it("should warn if AI session is missing", async () => {
				controller.aiSession = null;
				const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

				await controller.processCommand("command");

				expect(warnSpy).toHaveBeenCalledWith(
					expect.stringContaining("AI Session not available"),
				);
				warnSpy.mockRestore();
			});

			it("should parse successful AI response and execute action", async () => {
				controller.aiSession = {
					prompt: vi.fn().mockResolvedValue(
						JSON.stringify({
							action: "move",
							value: "up",
							feedback: "Moving up",
							lang: "en-US",
						}),
					),
					destroy: vi.fn(),
				};
				vi.spyOn(controller, "speak");
				vi.spyOn(controller, "executeAction");

				await controller.processCommand("move up");

				expect(controller.speak).toHaveBeenCalledWith("Moving up", "en-US");
				expect(controller.executeAction).toHaveBeenCalledWith(
					"move",
					"up",
					"en-US",
				);
			});

			it("should handle JSON parse errors", async () => {
				controller.aiSession = {
					prompt: vi.fn().mockResolvedValue("Invalid JSON"),
					destroy: vi.fn(),
				};
				const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

				await controller.processCommand("test");

				expect(warnSpy).toHaveBeenCalledWith(
					expect.stringContaining("Failed to parse"),
					expect.any(String),
				);
				warnSpy.mockRestore();
			});

			it("should handle AI interaction errors", async () => {
				controller.aiSession = {
					prompt: vi.fn().mockRejectedValue(new Error("Network Error")),
					destroy: vi.fn(),
				};
				const errorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});

				await controller.processCommand("test");

				expect(errorSpy).toHaveBeenCalledWith(
					expect.stringContaining("AI processing error"),
					expect.any(Error),
				);
				errorSpy.mockRestore();
			});
		});
	});

	describe("AI Initialization", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should initialize AI when available", async () => {
			vi.spyOn(aiService, "checkAvailability").mockResolvedValue("readily");
			vi.spyOn(aiService, "createSession").mockResolvedValue(true);
			vi.spyOn(aiService, "getSession").mockReturnValue({
				prompt: vi.fn(),
				destroy: vi.fn(),
			});

			const newController = new VoiceController(host, options);
			await newController.initAI();

			// Verify AI sessions were created
			expect(newController.aiSession).toBeTruthy();
			expect(newController.npcSession).toBeTruthy();
		});

		it("should handle AI unavailable gracefully", async () => {
			vi.spyOn(aiService, "checkAvailability").mockResolvedValue("no");
			const createSpy = vi.spyOn(aiService, "createSession");

			const newController = new VoiceController(host, options);
			await newController.initAI();

			// Should not throw and sessions should remain null
			expect(newController.aiSession).toBeNull();
			expect(newController.npcSession).toBeNull();
			expect(createSpy).not.toHaveBeenCalled();
		});

		it("should handle AI initialization errors", async () => {
			vi.spyOn(aiService, "checkAvailability").mockRejectedValue(
				new Error("AI Error"),
			);

			const newController = new VoiceController(host, options);

			// Should not throw
			await expect(newController.initAI()).resolves.not.toThrow();
			expect(newController.aiSession).toBeNull();
		});
	});

	describe("handleResult", () => {
		it("should extract transcript from recognition event", () => {
			const processSpy = vi.spyOn(controller, "processCommand");
			const mockEvent = {
				results: [[{ transcript: "  MOVE UP  " }]],
			};

			controller.handleResult(mockEvent);

			expect(processSpy).toHaveBeenCalledWith("move up");
		});

		it("should handle multiple results and use the last one", () => {
			const processSpy = vi.spyOn(controller, "processCommand");
			const mockEvent = {
				results: [
					[{ transcript: "first" }],
					[{ transcript: "second" }],
					[{ transcript: "FINAL COMMAND" }],
				],
			};

			controller.handleResult(mockEvent);

			expect(processSpy).toHaveBeenCalledWith("final command");
		});

		it("should lowercase and trim transcript", () => {
			const processSpy = vi.spyOn(controller, "processCommand");
			const mockEvent = {
				results: [[{ transcript: "   INTERACT   " }]],
			};

			controller.handleResult(mockEvent);

			expect(processSpy).toHaveBeenCalledWith("interact");
		});
	});

	describe("toggle", () => {
		it("should start listening when currently disabled", () => {
			controller.enabled = false;
			controller.isListening = false;
			const startSpy = vi.spyOn(controller, "start");

			controller.toggle();

			expect(controller.enabled).toBe(true);
			expect(startSpy).toHaveBeenCalled();
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should stop listening when currently enabled", () => {
			controller.enabled = true;
			controller.isListening = true;
			const stopSpy = vi.spyOn(controller, "stop");

			controller.toggle();

			expect(controller.enabled).toBe(false);
			expect(stopSpy).toHaveBeenCalled();
			expect(host.requestUpdate).toHaveBeenCalled();
		});

		it("should toggle state multiple times", () => {
			controller.enabled = false;

			controller.toggle();
			expect(controller.enabled).toBe(true);

			controller.toggle();
			expect(controller.enabled).toBe(false);

			controller.toggle();
			expect(controller.enabled).toBe(true);
		});
	});

	describe("celebrateChapter", () => {
		it("should speak celebration phrase in English", async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);
			vi.clearAllMocks();

			controller.options.language = "en-US";
			controller.celebrateChapter();

			expect(voiceSynthesisService.speak).toHaveBeenCalled();
			const callArgs = /** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mock.calls[0];
			const spokenText = callArgs[0];

			// Should be one of the English phrases
			expect(spokenText).toMatch(/Chapter complete|System update|Victory/);
		});

		it("should speak celebration phrase in Spanish", async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);
			vi.clearAllMocks();

			controller.options.language = "es-ES";
			controller.celebrateChapter();

			expect(voiceSynthesisService.speak).toHaveBeenCalled();
			const callArgs = /** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mock.calls[0];
			const spokenText = callArgs[0];

			// Should be one of the Spanish phrases
			expect(spokenText).toMatch(
				/Capítulo completado|Actualización del sistema|Victoria/,
			);
		});

		it("should use correct language parameter", async () => {
			const { voiceSynthesisService } = await import(
				"../services/voice-synthesis-service.js"
			);
			vi.clearAllMocks();

			controller.options.language = "es-ES";
			controller.celebrateChapter();

			const callArgs = /** @type {import("vitest").Mock} */ (
				voiceSynthesisService.speak
			).mock.calls[0];
			const options = callArgs[1];

			expect(options.lang).toBe("es-ES");
		});
	});

	describe("showHelp", () => {
		it("should log help information to console", () => {
			const consoleSpy = vi.spyOn(console, "log");

			controller.showHelp();

			expect(consoleSpy).toHaveBeenCalled();
			const loggedText = consoleSpy.mock.calls[0][0];

			expect(loggedText).toContain("VOICE COMMANDS");
			expect(loggedText).toContain("MOVE");
			expect(loggedText).toContain("APPROACH");
			expect(loggedText).toContain("DIALOGUE");
			expect(loggedText).toContain("ACTIONS");

			consoleSpy.mockRestore();
		});

		it("should include multilingual commands", () => {
			const consoleSpy = vi.spyOn(console, "log");

			controller.showHelp();

			const loggedText = consoleSpy.mock.calls[0][0];

			// Should include both English and Spanish
			expect(loggedText).toContain("Up/Arriba");
			expect(loggedText).toContain("Next/Siguiente");
			expect(loggedText).toContain("Interact/Interactúa");

			consoleSpy.mockRestore();
		});
	});

	describe("Internal Logic & Callbacks", () => {
		it("should execute default callbacks cleanly", () => {
			// Create controller without overrides to test defaults
			const defaultController = new VoiceController(host);
			expect(() => defaultController.options.onMove?.(0, 0)).not.toThrow();
			expect(() => defaultController.options.onInteract?.()).not.toThrow();
			expect(() => defaultController.options.onPause?.()).not.toThrow();
			expect(() => defaultController.options.onNextSlide?.()).not.toThrow();
			expect(() => defaultController.options.onPrevSlide?.()).not.toThrow();
			expect(() => defaultController.options.onMoveToNpc?.()).not.toThrow();
			expect(() => defaultController.options.onMoveToExit?.()).not.toThrow();
			expect(defaultController.options.onGetDialogText?.()).toBe("");
			expect(defaultController.options.onGetContext?.()).toEqual({
				isDialogOpen: false,
				isRewardCollected: false,
			});
			expect(() =>
				defaultController.options.onDebugAction?.("test", "val"),
			).not.toThrow();
			expect(defaultController.options.isEnabled?.()).toBe(false);
		});

		it("should handle speech synthesis callbacks", () => {
			vi.useFakeTimers();
			const speakSpy = vi.spyOn(voiceSynthesisService, "speak");

			// Mock implementation to trigger callbacks
			speakSpy.mockImplementation((_text, opts) => {
				if (opts) {
					opts.onStart?.();
					opts.onEnd?.();
					opts.onError?.(/** @type {any} */ ({ error: "test-error" }));
				}
			});

			controller.enabled = true;
			controller.speak("test");

			// onStart sets isSpeaking = true
			// onEnd sets isSpeaking = false and tries to restart if enabled

			expect(speakSpy).toHaveBeenCalled();

			// Advance timers to trigger the restart timeout in onEnd
			vi.advanceTimersByTime(500);
			vi.useRealTimers();
		});

		it("should handle unstable session restarts (short duration)", () => {
			vi.useFakeTimers();
			controller.enabled = true;
			controller.isListening = true;

			// Simulate immediate end (unstable)
			controller.lastStartTime = Date.now();
			if (controller.recognition) {
				// @ts-expect-error
				controller.recognition.onend?.();
			}

			expect(controller.restartAttempts).toBeGreaterThan(0);

			vi.advanceTimersByTime(200); // Wait for backoff
			vi.useRealTimers();
		});

		it("should reset restart attempts on stable session", () => {
			vi.useFakeTimers();
			controller.enabled = true;
			controller.isListening = true;

			// Simulate stable session (>2s)
			controller.lastStartTime = Date.now() - 3000;
			if (controller.recognition) {
				// @ts-expect-error
				controller.recognition.onend?.();
			}

			expect(controller.restartAttempts).toBe(0);
			vi.useRealTimers();
		});

		it("should trigger onstart handler", () => {
			if (controller.recognition) {
				controller.recognition.onstart?.(new Event("start"));
				expect(controller.isListening).toBe(true);
			}
		});

		it("should log restart warning after multiple attempts", () => {
			vi.useFakeTimers();
			controller.enabled = true;
			controller.isListening = true;
			// Start with high attempts to trigger the > 2 branch
			controller.restartAttempts = 3;

			// Unstable session to trigger restart increment
			controller.lastStartTime = Date.now();

			if (controller.recognition) {
				// @ts-expect-error
				controller.recognition.onend?.();
			}

			expect(controller.restartAttempts).toBe(4);
			vi.useRealTimers();
		});
	});

	describe("Regression Prevention", () => {
		it("should not auto-restart when disabled", () => {
			controller.enabled = false;
			controller.isListening = true;

			// Simulate onend
			controller.recognition?.onend?.(/** @type {any} */ ({}));

			expect(controller.isListening).toBe(false);
			// Should not attempt to restart
			expect(controller.restartAttempts).toBe(0);
		});

		it("should not auto-restart when speaking", () => {
			controller.enabled = true;
			controller.isSpeaking = true;
			controller.isListening = true;

			// Simulate onend
			controller.recognition?.onend?.(/** @type {any} */ ({}));

			expect(controller.isListening).toBe(false);
			// Should not attempt to restart while speaking
			expect(controller.restartAttempts).toBe(0);
		});

		it("should handle rapid toggle calls", () => {
			controller.enabled = false;

			controller.toggle();
			controller.toggle();
			controller.toggle();

			// Should end in enabled state
			expect(controller.enabled).toBe(true);
		});

		it("should cleanup on disconnect", () => {
			const stopSpy = vi.spyOn(controller, "stop");

			controller.hostDisconnected();

			expect(stopSpy).toHaveBeenCalled();
			expect(controller.aiSession).toBeNull();
			expect(controller.npcSession).toBeNull();
		});
	});
});
