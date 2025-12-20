import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceSynthesisService } from "./voice-synthesis-service.js";

describe("VoiceSynthesisService", () => {
	let service;
	let speechSynthesisMock;
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
		it("should initialize with synthesis and voices", () => {
			expect(service.synthesis).toBe(speechSynthesisMock);
			expect(service.voices).toHaveLength(4);
			expect(service.isSpeaking).toBe(false);
		});
	});

	describe("getBestVoice", () => {
		it("should return null if no voices available", () => {
			service.voices = [];
			const voice = service.getBestVoice("en-US", "hero");
			expect(voice).toBeNull();
		});

		it("should return English voice for hero", () => {
			const voice = service.getBestVoice("en-US", "hero");
			expect(voice).toBeDefined();
			expect(voice.lang).toBe("en-US");
			expect(voice.name).toContain("Google US English");
		});

		it("should return Spanish voice for hero", () => {
			const voice = service.getBestVoice("es-ES", "hero");
			expect(voice).toBeDefined();
			expect(voice.lang).toBe("es-ES");
			expect(voice.name).toContain("español");
		});

		it("should return different voice for NPC", () => {
			const voice = service.getBestVoice("en-US", "npc");
			expect(voice).toBeDefined();
			expect(voice.lang).toBe("en-US");
			// NPCs can get either male or female voices
			expect(["Google US English", "Samantha"]).toContain(voice.name);
		});

		it("should handle language normalization", () => {
			const voice = service.getBestVoice("es", "hero");
			expect(voice).toBeDefined();
			expect(voice.lang).toBe("es-ES");
		});
	});

	describe("speak", () => {
		it("should not speak if text is empty", () => {
			service.speak("", { lang: "en-US" });
			expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
		});

		it("should not speak if text is not a string", () => {
			service.speak(null, { lang: "en-US" });
			expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
		});

		it("should create utterance and speak", () => {
			service.speak("Hello world", { lang: "en-US", role: "hero" });

			expect(SpeechSynthesisUtteranceMock).toHaveBeenCalledWith("Hello world");
			expect(speechSynthesisMock.speak).toHaveBeenCalled();
		});

		it("should set hero voice profile", () => {
			service.speak("Hello", { lang: "en-US", role: "hero" });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			expect(utterance.rate).toBe(1.1);
			expect(utterance.pitch).toBeGreaterThan(1.0);
			expect(utterance.pitch).toBeLessThan(1.15);
		});

		it("should set NPC voice profile", () => {
			service.speak("Greetings", { lang: "en-US", role: "npc" });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			expect(utterance.rate).toBe(0.85);
			expect(utterance.pitch).toBeGreaterThan(0.8);
			expect(utterance.pitch).toBeLessThan(0.9);
		});

		it("should cancel previous speech if not queuing", () => {
			service.speak("Test", { lang: "en-US", queue: false });

			expect(speechSynthesisMock.cancel).toHaveBeenCalled();
		});

		it("should not cancel if queuing", () => {
			service.speak("Test", { lang: "en-US", queue: true });

			expect(speechSynthesisMock.cancel).not.toHaveBeenCalled();
		});

		it("should call onStart callback", () => {
			const onStart = vi.fn();
			service.speak("Test", { lang: "en-US", onStart });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			utterance.onstart();

			expect(onStart).toHaveBeenCalled();
			expect(service.isSpeaking).toBe(true);
		});

		it("should call onEnd callback", () => {
			const onEnd = vi.fn();
			service.speak("Test", { lang: "en-US", onEnd });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			utterance.onend();

			expect(onEnd).toHaveBeenCalled();
			expect(service.isSpeaking).toBe(false);
		});

		it("should call onError callback", () => {
			const onError = vi.fn();
			service.speak("Test", { lang: "en-US", onError });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			const errorEvent = { error: "test-error" };
			utterance.onerror(errorEvent);

			expect(onError).toHaveBeenCalledWith(errorEvent);
			expect(service.isSpeaking).toBe(false);
		});

		it("should use default language if not provided", () => {
			service.speak("Test", { role: "hero" });

			const utterance = SpeechSynthesisUtteranceMock.mock.results[0].value;
			expect(utterance.lang).toBe("en-US");
		});
	});

	describe("cancel", () => {
		it("should cancel synthesis and reset speaking status", () => {
			service.isSpeaking = true;
			service.cancel();

			expect(speechSynthesisMock.cancel).toHaveBeenCalled();
			expect(service.isSpeaking).toBe(false);
		});

		it("should handle missing synthesis gracefully", () => {
			service.synthesis = null;
			expect(() => service.cancel()).not.toThrow();
		});
	});

	describe("getSpeakingStatus", () => {
		it("should return current speaking status", () => {
			expect(service.getSpeakingStatus()).toBe(false);

			service.isSpeaking = true;
			expect(service.getSpeakingStatus()).toBe(true);
		});
	});
});
