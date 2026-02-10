import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceController } from "./voice-controller.js";

// Mock dependencies
/** @type {any} */
let mockVoiceSynthesisService;
/** @type {any} */
let mockAIService;

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
		controller.narration.voiceService = mockVoiceSynthesisService;
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
		// mockDialogueService = controller.dialogueService;

		// @ts-expect-error
		controller._dialogContext = {
			isDialogOpen: false,
			isRewardCollected: false,
		};
	});

	// Command processing logic has been moved to VoiceCommandProcessor
	// and should be tested there.
	// We only test that VoiceController integrates these pieces correctly at a high level
	// but currently it's hard to test the internal composition without exposing private properties.
	// So we keep the speak test which is a direct delegation.

	describe("speak", () => {
		it("should apply voice profiles correctly", async () => {
			await controller.speak("Hello", { lang: "en-US", role: "hero" });

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
