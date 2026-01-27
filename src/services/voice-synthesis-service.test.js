import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceSynthesisService } from "./voice-synthesis-service.js";

describe("VoiceSynthesisService", () => {
	/** @type {VoiceSynthesisService} */
	let service;
	/** @type {{ speak: import("vitest").Mock; cancel: import("vitest").Mock; getVoices: import("vitest").Mock; onvoiceschanged: null; }} */
	let speechSynthesisMock;
	/** @type {any} */
	let SpeechSynthesisUtteranceMock;

	beforeEach(() => {
		// Mock speechSynthesis
		speechSynthesisMock = {
			speak: vi.fn(),
			cancel: vi.fn(),
			getVoices: vi.fn().mockReturnValue([
				{ name: "Google US English", lang: "en-US" },
				{ name: "Samantha", lang: "en-US" },
				{ name: "Google español", lang: "es-ES" },
				{ name: "Mónica", lang: "es-ES" },
			]),
			onvoiceschanged: null,
		};
		vi.stubGlobal("speechSynthesis", speechSynthesisMock);

		// Mock SpeechSynthesisUtterance
		SpeechSynthesisUtteranceMock = vi.fn(function (text) {
			this.text = text;
			this.lang = "";
			this.rate = 1;
			this.pitch = 1;
			this.voice = null;
			this.onstart = null;
			this.onend = null;
			this.onerror = null;
		});
		vi.stubGlobal("SpeechSynthesisUtterance", SpeechSynthesisUtteranceMock);

		service = new VoiceSynthesisService();
	});

	describe("Initialization", () => {
		it("should initialize with voices", () => {
			expect(service.voices).toHaveLength(4);
			expect(service.isSpeaking).toBe(false);
		});
	});

	describe("getBestVoice", () => {
		it("should return null if no voices available", () => {
			service.voices = [];
			const voice = service.getBestVoice("en-US", ["Alex"]);
			expect(voice).toBeNull();
		});

		it("should return voice by preferred name", () => {
			const voice = service.getBestVoice("en-US", ["Samantha"]);
			expect(voice).toBeDefined();
			expect(voice?.name).toBe("Samantha");
		});

		it("should return fallback voice if preferred name not found", () => {
			const voice = service.getBestVoice("en-US", ["Alex"]);
			expect(voice).toBeDefined();
			expect(voice?.name).toBe("Google US English"); // First in list
		});

		it("should return Spanish voice when requested", () => {
			const voice = service.getBestVoice("es-ES", ["Mónica"]);
			expect(voice).toBeDefined();
			expect(voice?.lang).toBe("es-ES");
			expect(voice?.name).toBe("Mónica");
		});
	});

	describe("speak", () => {
		it("should create utterance with provided options", async () => {
			const voice = { name: "Samantha", lang: "en-US" };
			const promise = service.speak("Hello", {
				lang: "en-US",
				rate: 1.2,
				pitch: 0.9,
				voice: /** @type {any} */ (voice),
			});

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			utterance.onend();
			await promise;

			expect(SpeechSynthesisUtteranceMock).toHaveBeenCalledWith("Hello");
			expect(utterance.lang).toBe("en-US");
			expect(utterance.rate).toBe(1.2);
			expect(utterance.pitch).toBe(0.9);
			expect(utterance.voice).toBe(voice);
			expect(speechSynthesisMock.speak).toHaveBeenCalled();
		});

		it("should cancel previous speech if not queuing", () => {
			service.speak("Test", { queue: false });
			expect(speechSynthesisMock.cancel).toHaveBeenCalled();
		});

		it("should resolve promise when speech ends", async () => {
			const promise = service.speak("Test");
			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;

			utterance.onend();
			await promise;

			expect(service.isSpeaking).toBe(false);
		});
	});

	describe("cancel", () => {
		it("should cancel synthesis and reset speaking status", () => {
			service.isSpeaking = true;
			service.cancel();

			expect(speechSynthesisMock.cancel).toHaveBeenCalled();
			expect(service.isSpeaking).toBe(false);
		});
	});
});
