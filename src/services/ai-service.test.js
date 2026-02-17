import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIService } from "./ai-service.js";

import { CheckAIAvailabilityUseCase } from "../use-cases/check-ai-availability.js";

vi.mock("../use-cases/check-ai-availability.js", () => ({
	CheckAIAvailabilityUseCase: vi.fn(() => ({
		execute: vi.fn(),
	})),
}));

describe("AIService", () => {
	/** @type {AIService} */
	let service;
	beforeEach(() => {
		service = new AIService();

		// Silence expected warnings/errors for these tests
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
	});

	describe("checkAvailability", () => {

		beforeEach(() => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should return 'readily' when AI is ready", async () => {
			executeMock.mockResolvedValue("readily");
			const status = await service.checkAvailability();

			expect(status).toBe("readily");
			expect(service.isAvailable).toBe(true);
		});

		it("should return 'available' when AI is available", async () => {
			executeMock.mockResolvedValue("available");
			const status = await service.checkAvailability();

			expect(status).toBe("available");
			expect(service.isAvailable).toBe(true);
		});

		it("should return 'downloadable' when model needs download", async () => {
			executeMock.mockResolvedValue("downloadable");
			const status = await service.checkAvailability();

			expect(status).toBe("downloadable");
			expect(service.isAvailable).toBe(false);
		});

		it("should return 'no' when LanguageModel is undefined", async () => {
			executeMock.mockResolvedValue("no");
			const status = await service.checkAvailability();

			expect(status).toBe("no");
		});

		it("should handle errors gracefully", async () => {
			executeMock.mockRejectedValue(new Error("API Error"));

			const status = await service.checkAvailability();

			expect(status).toBe("no");
		});
	});

			beforeEach(() => {

				vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");

			});

	
		beforeEach(() => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
		});
		it("should create a session with session ID when AI is readily available", async () => {
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			window.LanguageModel = {create: vi.fn().mockResolvedValue(mockSession)};

			const session = await service.createSession("alarion", {
				language: "en",
				initialPrompts: [{ role: "system", content: "Test" }],
			});

			expect(session).toBe(mockSession);
			expect(service.hasSession("alarion")).toBe(true);
			expect(service.getSession("alarion")).toBe(mockSession);
		});

		it("should create multiple independent sessions", async () => {
			const alarionSession = { prompt: vi.fn(), destroy: vi.fn() };
			const rainwalkerSession = { prompt: vi.fn(), destroy: vi.fn() };

			window.LanguageModel = {create: vi.fn().mockResolvedValueOnce(alarionSession).mockResolvedValueOnce(rainwalkerSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});
			await service.createSession("rainwalker", {
				language: "en",
				initialPrompts: [],
			});

			expect(service.hasSession("alarion")).toBe(true);
			expect(service.hasSession("rainwalker")).toBe(true);
			expect(service.getSession("alarion")).toBe(alarionSession);
			expect(service.getSession("rainwalker")).toBe(rainwalkerSession);
		});

		it("should replace existing session with same ID", async () => {
			const oldSession = { prompt: vi.fn(), destroy: vi.fn() };
			const newSession = { prompt: vi.fn(), destroy: vi.fn() };

			window.LanguageModel = {create: vi.fn().mockResolvedValueOnce(oldSession).mockResolvedValueOnce(newSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});
			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			expect(oldSession.destroy).toHaveBeenCalled();
			expect(service.getSession("alarion")).toBe(newSession);
		});

		it("should throw error when AI is not available", async () => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("no");

			await expect(
				service.createSession("alarion", {
					language: "en",
					initialPrompts: [],
				}),
			).rejects.toThrow("AI not available");
		});
	});
		beforeEach(() => {});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should download model and create session", async () => {
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			const mockMonitor = {
				addEventListener: vi.fn(),
			};

			window.LanguageModel = {create: vi.fn().mockImplementation(({ monitor }) => {
				if (monitor) {
					monitor(mockMonitor);
				}
				return Promise.resolve(mockSession);
			})};

			const session = await service.downloadModel({
				language: "en",
			});

			expect(session).toBe(mockSession);
			expect(service.isAvailable).toBe(true);
		});

		it("should track download progress", async () => {
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			const progressCallback = vi.fn();
			/** @type {(e: import('../types/services.d.js').AIDownloadProgressEvent) => void} */
			let downloadListener = (..._args) => {
				throw new Error("Download listener not set");
			};

			window.LanguageModel = {create: vi.fn().mockImplementation(({ monitor }) => {
				if (monitor) {
					const mockMonitor = {
						addEventListener: (
							/** @type {string} */ _event,
							/** @type {any} */ listener,
						) => {
							downloadListener =
								/** @type {(e: import('../types/services.d.js').AIDownloadProgressEvent) => void} */ (
									listener
								);
						},
					};
					monitor(mockMonitor);
				}
				return Promise.resolve(mockSession);
			})};

			await service.downloadModel({
				language: "en",
				onDownloadProgress: progressCallback,
			});

			// Simulate download progress
			downloadListener({ loaded: 50, total: 100 });

			expect(progressCallback).toHaveBeenCalledWith({ loaded: 50, total: 100 });
		});

		it("should throw error if download fails", async () => {
			window.LanguageModel = {create: vi.fn().mockRejectedValue(new Error("Download failed"))};

			await expect(service.downloadModel({ language: "en" })).rejects.toThrow(
				"Download failed",
			);
		});
	});
		it("should return null for non-existent session", () => {
			const session = service.getSession("nonexistent");

			expect(session).toBeNull();
		});

		it("should return existing session", async () => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			window.LanguageModel = {create: vi.fn().mockResolvedValue(mockSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			const session = service.getSession("alarion");

			expect(session).toBe(mockSession);
		});
	});
		it("should return false for non-existent session", () => {
			expect(service.hasSession("nonexistent")).toBe(false);
		});

		it("should return true for existing session", async () => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			window.LanguageModel = {create: vi.fn().mockResolvedValue(mockSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			expect(service.hasSession("alarion")).toBe(true);
		});
	});
		it("should destroy specific session", async () => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			window.LanguageModel = {create: vi.fn().mockResolvedValue(mockSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			service.destroySession("alarion");

			expect(mockSession.destroy).toHaveBeenCalled();
			expect(service.hasSession("alarion")).toBe(false);
		});

		it("should not throw when destroying non-existent session", () => {
			expect(() => service.destroySession("nonexistent")).not.toThrow();
		});
	});
		it("should destroy all sessions", async () => {
			vi.mocked(CheckAIAvailabilityUseCase.prototype.execute).mockResolvedValue("readily");
			const alarionSession = { prompt: vi.fn(), destroy: vi.fn() };
			const rainwalkerSession = { prompt: vi.fn(), destroy: vi.fn() };

			window.LanguageModel = {create: vi.fn().mockResolvedValueOnce(alarionSession).mockResolvedValueOnce(rainwalkerSession)};

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});
			await service.createSession("rainwalker", {
				language: "en",
				initialPrompts: [],
			});

			service.destroyAllSessions();

			expect(alarionSession.destroy).toHaveBeenCalled();
			expect(rainwalkerSession.destroy).toHaveBeenCalled();
			expect(service.hasSession("alarion")).toBe(false);
			expect(service.hasSession("rainwalker")).toBe(false);
		});
	});
});
