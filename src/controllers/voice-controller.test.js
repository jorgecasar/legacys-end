import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceController } from "./voice-controller.js";

// Mock dependencies
/** @type {any} */
let mockVoiceSynthesisService;
/** @type {any} */
let mockAIService;
/** @type {any} */
let mockDialogueService;

// Mock DialogueGenerationService
vi.mock("../services/dialogue-generation-service.js", () => {
	const generate = vi.fn();
	const prefetch = vi.fn();
	const clearCache = vi.fn();

	function DialogueGenerationServiceMock() {
		this.generate = generate;
		this.prefetch = prefetch;
		this.clearCache = clearCache;
	}

	DialogueGenerationServiceMock.prototype.generate = generate;
	DialogueGenerationServiceMock.prototype.prefetch = prefetch;
	DialogueGenerationServiceMock.prototype.clearCache = clearCache;

	return {
		DialogueGenerationService: DialogueGenerationServiceMock,
	};
});

// Import the mocked class to assert on it
import { DialogueGenerationService } from "../services/dialogue-generation-service.js";

// Mock @lit/context
vi.mock("@lit/context", () => {
	class MockContextConsumer {
		/**
		 * @param {any} host
		 * @param {any} options
		 */
		constructor(host, options) {
			this.host = host;
			this.options = options;
			// Immediately call callback if provided (optional, to simulate context)
			if (options?.callback) {
				this.callback = options.callback;
			}
		}
	}
	return {
		ContextConsumer: MockContextConsumer,
		createContext: vi.fn(),
	};
});

describe("VoiceController", () => {
	/** @type {any} */
	let host;
	/** @type {VoiceController} */
	let controller;

	beforeEach(() => {
		vi.clearAllMocks();

		mockVoiceSynthesisService = {
			speak: vi.fn().mockResolvedValue(undefined),
			cancel: vi.fn(),
			getBestVoice: vi.fn(),
			getSpeakingStatus: vi.fn().mockReturnValue(false),
		};

		mockAIService = {
			checkAvailability: vi.fn().mockResolvedValue("available"),
			createSession: vi.fn().mockResolvedValue(undefined),
			getSession: vi.fn(),
			destroySession: vi.fn(),
			hasSession: vi.fn().mockReturnValue(true),
		};

		host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
			dispatchEvent: vi.fn(),
		};

		// Mock SpeechRecognition
		class SpeechRecognitionMock {
			constructor() {
				this.start = vi.fn();
				this.stop = vi.fn();
				this.lang = "en-US";
			}
		}
		vi.stubGlobal("SpeechRecognition", SpeechRecognitionMock);
		vi.stubGlobal("webkitSpeechRecognition", SpeechRecognitionMock);

		controller = new VoiceController(host);

		// Initialize lazy contexts
		controller.initContexts();

		// Manually inject dependencies that are normally injected by context
		controller.aiService = mockAIService;
		controller.voiceSynthesisService = mockVoiceSynthesisService;
		controller.logger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		};

		// Manually instantiate DialogueGenerationService since private #updateDialogueService isn't triggered
		controller.dialogueService = new DialogueGenerationService(
			/** @type {import('../types/services.d.js').IAIService} */ (
				controller.aiService
			),
			controller.logger,
		);

		// Ensure dialogue service is updated
		// The callbacks above should trigger proper internal state updates

		// If needed, override specifically for test isolation (though callbacks should handle it)
		// controller.dialogueService is created by _aiConsumer + _loggerConsumer callbacks

		// Access the mock instance
		mockDialogueService = controller.dialogueService;

		// @ts-expect-error
		controller._dialogContext = {
			isDialogOpen: false,
			isRewardCollected: false,
		};
	});

	describe("processCommand", () => {
		it("should use DialogueGenerationService to process commands", async () => {
			// Setup mock return
			mockDialogueService.generate.mockResolvedValue(
				'{"action": "interact", "feedback": "Hi"}',
			);

			await controller.processCommand("hello");

			expect(mockDialogueService.generate).toHaveBeenCalledWith(
				"alarion",
				expect.stringContaining("hello"),
				true,
			);
			expect(mockVoiceSynthesisService.speak).toHaveBeenCalledWith(
				"Hi",
				expect.objectContaining({ lang: expect.stringContaining("en") }),
			);
		});
	});

	describe("executeAction", () => {
		beforeEach(() => {
			controller._dialogContext = {
				isDialogOpen: true,
				isRewardCollected: false,
				npcName: "NPC",
				exitZoneName: null,
				chapterTitle: "Chapter 1",
				currentDialogText: "Hello world",
				nextDialogText: "Next line",
			};
		});

		it("should handle 'move_to_npc'", async () => {
			await controller.executeAction("move_to_npc", null);
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "move-to-npc" }),
			);
		});

		it("should handle 'interact' and speak", async () => {
			// Mock narrateDialogue behavior
			mockDialogueService.generate.mockResolvedValue("Narrated text");

			vi.useFakeTimers();
			const promise = controller.executeAction("interact", null);

			// Simulate the delay if any
			await vi.advanceTimersByTimeAsync(100);
			await promise;

			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "interact" }),
			);
			// Should call narrateDialogue -> DialogueService.generate
			expect(mockDialogueService.generate).toHaveBeenCalledWith(
				"npc",
				expect.any(String),
			);
			expect(mockVoiceSynthesisService.speak).toHaveBeenCalledWith(
				"Narrated text",
				expect.any(Object),
			);
			vi.useRealTimers();
		});

		it("should handle 'next_slide' with prefetching", async () => {
			await controller.executeAction("next_slide", null);

			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "next-slide" }),
			);
			expect(mockDialogueService.prefetch).toHaveBeenCalledWith(
				"npc",
				expect.any(String),
			);
		});
	});

	describe("speak", () => {
		it("should apply voice profiles correctly", async () => {
			await controller.speak("Hello", "en-US", "hero");

			expect(mockVoiceSynthesisService.getBestVoice).toHaveBeenCalledWith(
				"en-US",
				expect.any(Array),
			);
			expect(mockVoiceSynthesisService.speak).toHaveBeenCalledWith(
				"Hello",
				expect.objectContaining({
					lang: "en-US",
					rate: 1.1,
				}),
			);
		});
	});
});
