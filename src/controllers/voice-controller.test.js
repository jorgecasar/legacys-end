import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock voiceSynthesisService BEFORE importing VoiceController
vi.mock("../services/voice-synthesis-service.js", () => ({
	voiceSynthesisService: {
		speak: vi.fn(),
		cancel: vi.fn(),
		getBestVoice: vi.fn(),
		getSpeakingStatus: vi.fn().mockReturnValue(false),
	},
}));

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
			controller.executeAction("move_to_npc");
			expect(options.onMoveToNpc).toHaveBeenCalled();
		});

		it("should handle 'move_to_exit'", () => {
			controller.executeAction("move_to_exit");
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
			expect(controller.recognition.start).toHaveBeenCalled();
		});

		it("should stop recognition when stop() is called", () => {
			controller.isListening = true;
			controller.stop();
			expect(controller.recognition.stop).toHaveBeenCalled();
			expect(controller.isListening).toBe(false);
		});

		it("should not start if already listening", () => {
			controller.isListening = true;
			controller.start();
			expect(controller.recognition.start).not.toHaveBeenCalled();
		});
	});

	describe("Command Processing", () => {
		it("should handle movement commands", () => {
			controller.executeAction("move_up");
			expect(options.onMove).toHaveBeenCalledWith(0, -5);
		});

		it("should handle move_down command", () => {
			controller.executeAction("move_down");
			expect(options.onMove).toHaveBeenCalledWith(0, 5);
		});

		it("should handle move_left command", () => {
			controller.executeAction("move_left");
			expect(options.onMove).toHaveBeenCalledWith(-5, 0);
		});

		it("should handle move_right command", () => {
			controller.executeAction("move_right");
			expect(options.onMove).toHaveBeenCalledWith(5, 0);
		});

		it("should handle pause command", () => {
			controller.executeAction("pause");
			expect(options.onPause).toHaveBeenCalled();
		});

		it("should handle next_slide command", () => {
			controller.executeAction("next_slide");
			expect(options.onNextSlide).toHaveBeenCalled();
		});

		it("should handle prev_slide command", () => {
			controller.executeAction("prev_slide");
			expect(options.onPrevSlide).toHaveBeenCalled();
		});

		it("should handle unknown commands gracefully", () => {
			expect(() => controller.executeAction("unknown_action")).not.toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should handle recognition errors gracefully", () => {
			const errorEvent = /** @type {any} */ ({ error: "network" });
			expect(() => controller.recognition.onerror(errorEvent)).not.toThrow();
		});

		it("should stop listening on not-allowed error", () => {
			controller.isListening = true;
			const errorEvent = /** @type {any} */ ({ error: "not-allowed" });
			controller.recognition.onerror(errorEvent);
			expect(controller.isListening).toBe(false);
		});
	});
});
