import { describe, expect, it, vi } from "vitest";
import { NextDialogSlideCommand } from "../commands/next-dialog-slide-command.js";
import { PrevDialogSlideCommand } from "../commands/prev-dialog-slide-command.js";
import { VoiceController } from "../controllers/voice-controller.js";
import { setupVoice } from "./setup-voice.js";

// Mock dependencies
vi.mock("../controllers/voice-controller.js");
vi.mock("../commands/next-dialog-slide-command.js");
vi.mock("../commands/prev-dialog-slide-command.js");

describe("setupVoice", () => {
	it("should initialize VoiceController with correct options including next/prev slide commands calling host", () => {
		const host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
		};
		const context = {
			logger: {},
			aiService: {},
			voiceSynthesisService: {},
			commandBus: { execute: vi.fn() },
			eventBus: { emit: vi.fn() },
			gameState: { getState: () => ({}) },
			questController: {},
		};

		setupVoice(/** @type {any} */ (host), /** @type {any} */ (context));

		expect(VoiceController).toHaveBeenCalledWith(
			host,
			expect.objectContaining({
				onNextSlide: expect.any(Function),
				onPrevSlide: expect.any(Function),
			}),
		);

		// Verify callbacks instantiate commands with host
		// @ts-expect-error
		const voiceControllerCall = VoiceController.mock.calls[0];
		const options = voiceControllerCall[1];

		// Test next slide callback
		options.onNextSlide();
		expect(NextDialogSlideCommand).toHaveBeenCalledWith(host);

		// Test prev slide callback
		options.onPrevSlide();
		expect(PrevDialogSlideCommand).toHaveBeenCalledWith(host);
	});
});
