import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceCommandProcessor } from "./voice-command-processor.js";

// Mock dialogue service
/** @type {any} */
let mockDialogueService;
/** @type {any} */
let mockLogger;
/** @type {VoiceCommandProcessor} */
let processor;
/** @type {any} */
let host;

describe("VoiceCommandProcessor", () => {
	beforeEach(() => {
		mockDialogueService = {
			generate: vi.fn(),
			prefetch: vi.fn(),
		};
		mockLogger = {
			error: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
		};
		host = {
			dispatchEvent: vi.fn(),
		};
		processor = new VoiceCommandProcessor(mockDialogueService, mockLogger);
	});

	describe("process", () => {
		it("should process command and execute action", async () => {
			mockDialogueService.generate.mockResolvedValue(
				JSON.stringify({
					action: "interact",
					feedback: "Doing it",
					lang: "en-US",
				}),
			);

			const callbacks = {
				onSpeak: vi.fn(),
				onNarrate: vi.fn(),
				onAction: vi.fn(),
			};

			const context = {
				isDialogOpen: true,
				currentDialogText: "Hi there",
			};

			await processor.process(
				"interact",
				/** @type {any} */ (context),
				"en-US",
				callbacks,
				host,
			);

			expect(mockDialogueService.generate).toHaveBeenCalled();
			expect(callbacks.onSpeak).toHaveBeenCalledWith("Doing it", "en-US");
			// Check if interact event was dispatched on host
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "interact" }),
			);
			// Also interact action logic calls narrateDialogue immediately via config
			// But that's if we mocked narrate callback?
			// The config calls controller.interact() then setTimeout -> narrateDialogue.
			// executeAction shim calls _emit(interact) then... oh wait.
			// The config logic is what calls controller.narrateDialogue.
			// executeVoiceAction in config/voice-command-actions.js:
			// interact: () => { controller.interact(); setTimeout(...) }
			// My shim implements interact: () => _emit(...) and narrateDialogue: ...
			// So yes, it should work. But setTimeout makes test tricky.
		});
		it("should fall back to regex when AI fails", async () => {
			mockDialogueService.generate.mockRejectedValue(new Error("AI error"));
			const callbacks = {
				onSpeak: vi.fn(),
				onNarrate: vi.fn(),
				onAction: vi.fn(),
			};

			// Spy on executeAction to verify fallback calls it
			const executeSpy = vi.spyOn(processor, "executeAction");

			await processor.process(
				"Please move up",
				/** @type {any} */ ({}),
				"en-US",
				callbacks,
				host,
			);

			expect(mockLogger.warn).toHaveBeenCalled();
			expect(executeSpy).toHaveBeenCalledWith(
				"move_up",
				"en-US",
				expect.anything(),
				callbacks,
				host,
			);
		});
	});

	describe("executeAction", () => {
		it("should handle 'move_to_npc'", async () => {
			const callbacks = {
				onSpeak: vi.fn(),
				onNarrate: vi.fn(),
				onAction: vi.fn(),
			};
			await processor.executeAction(
				"move_to_npc",
				"en-US",
				/** @type {any} */ ({}),
				callbacks,
				host,
			);
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "move-to-npc" }),
			);
		});

		it("should handle 'next_slide' and prefetch", async () => {
			const callbacks = {
				onSpeak: vi.fn(),
				onNarrate: vi.fn(),
				onAction: vi.fn(),
			};
			const context = {
				nextDialogText: "Next text",
			};
			await processor.executeAction(
				"next_slide",
				"en-US",
				/** @type {any} */ (context),
				callbacks,
				host,
			);

			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({ type: "next-slide" }),
			);
			expect(mockDialogueService.prefetch).toHaveBeenCalled();
		});
	});
});
