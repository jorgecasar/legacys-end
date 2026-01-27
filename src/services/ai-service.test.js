import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIService } from "./ai-service.js";

describe("AIService", () => {
	/** @type {AIService} */
	let service;
	/** @type {{ availability: import("vitest").Mock; create: import("vitest").Mock; }} */
	let mockLanguageModel;

	beforeEach(() => {
		service = new AIService();

		// Mock LanguageModel API
		mockLanguageModel = {
			availability: vi.fn(),
			create: vi.fn(),
		};

		// @ts-expect-error - window.ai is experimental and not yet in standard types
		window.ai = { languageModel: mockLanguageModel };

		// Silence expected warnings/errors for these tests
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
	});

	describe("checkAvailability", () => {
		beforeEach(() => {});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should return 'readily' when AI is ready", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");

			const status = await service.checkAvailability();

			expect(status).toBe("readily");
			expect(service.isAvailable).toBe(true);
		});

		it("should return 'available' when AI is available", async () => {
			mockLanguageModel.availability.mockResolvedValue("available");

			const status = await service.checkAvailability();

			expect(status).toBe("available");
			expect(service.isAvailable).toBe(true);
		});

		it("should return 'downloadable' when model needs download", async () => {
			mockLanguageModel.availability.mockResolvedValue("downloadable");

			const status = await service.checkAvailability();

			expect(status).toBe("downloadable");
			expect(service.isAvailable).toBe(false);
		});

		it("should return 'no' when LanguageModel is undefined", async () => {
			// @ts-expect-error - Mocking unavailability for testing
			window.ai = undefined;

			const status = await service.checkAvailability();

			expect(status).toBe("no");
		});

		it("should handle errors gracefully", async () => {
			mockLanguageModel.availability.mockRejectedValue(new Error("API Error"));

			const status = await service.checkAvailability();

			expect(status).toBe("no");
		});
	});

	describe("createSession", () => {
		it("should create a session with session ID when AI is readily available", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			mockLanguageModel.create.mockResolvedValue(mockSession);

			const session = await service.createSession("alarion", {
				language: "en",
				initialPrompts: [{ role: "system", content: "Test" }],
			});

			expect(session).toBe(mockSession);
			expect(service.hasSession("alarion")).toBe(true);
			expect(service.getSession("alarion")).toBe(mockSession);
		});

		it("should create multiple independent sessions", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const alarionSession = { prompt: vi.fn(), destroy: vi.fn() };
			const rainwalkerSession = { prompt: vi.fn(), destroy: vi.fn() };

			mockLanguageModel.create
				.mockResolvedValueOnce(alarionSession)
				.mockResolvedValueOnce(rainwalkerSession);

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
			mockLanguageModel.availability.mockResolvedValue("readily");
			const oldSession = { prompt: vi.fn(), destroy: vi.fn() };
			const newSession = { prompt: vi.fn(), destroy: vi.fn() };

			mockLanguageModel.create
				.mockResolvedValueOnce(oldSession)
				.mockResolvedValueOnce(newSession);

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
			mockLanguageModel.availability.mockResolvedValue("no");

			await expect(
				service.createSession("alarion", {
					language: "en",
					initialPrompts: [],
				}),
			).rejects.toThrow("AI not available");
		});
	});

	describe("downloadModel", () => {
		beforeEach(() => {});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should download model and create session", async () => {
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			const mockMonitor = {
				addEventListener: vi.fn(),
			};

			mockLanguageModel.create.mockImplementation(({ monitor }) => {
				if (monitor) {
					monitor(mockMonitor);
				}
				return Promise.resolve(mockSession);
			});

			const session = await service.downloadModel({
				language: "en",
			});

			expect(session).toBe(mockSession);
			expect(service.isAvailable).toBe(true);
		});

		it("should track download progress", async () => {
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			const progressCallback = vi.fn();
			/** @type {(e: import('./interfaces.js').AIDownloadProgressEvent) => void} */
			let downloadListener = (..._args) => {
				throw new Error("Download listener not set");
			};

			mockLanguageModel.create.mockImplementation(({ monitor }) => {
				if (monitor) {
					const mockMonitor = {
						addEventListener: (
							/** @type {string} */ _event,
							/** @type {any} */ listener,
						) => {
							downloadListener =
								/** @type {(e: import('./interfaces.js').AIDownloadProgressEvent) => void} */ (
									listener
								);
						},
					};
					monitor(mockMonitor);
				}
				return Promise.resolve(mockSession);
			});

			await service.downloadModel({
				language: "en",
				onDownloadProgress: progressCallback,
			});

			// Simulate download progress
			downloadListener({ loaded: 50, total: 100 });

			expect(progressCallback).toHaveBeenCalledWith({ loaded: 50, total: 100 });
		});

		it("should throw error if download fails", async () => {
			mockLanguageModel.create.mockRejectedValue(new Error("Download failed"));

			await expect(service.downloadModel({ language: "en" })).rejects.toThrow(
				"Download failed",
			);
		});
	});

	describe("getSession", () => {
		it("should return null for non-existent session", () => {
			const session = service.getSession("nonexistent");

			expect(session).toBeNull();
		});

		it("should return existing session", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			mockLanguageModel.create.mockResolvedValue(mockSession);

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			const session = service.getSession("alarion");

			expect(session).toBe(mockSession);
		});
	});

	describe("hasSession", () => {
		it("should return false for non-existent session", () => {
			expect(service.hasSession("nonexistent")).toBe(false);
		});

		it("should return true for existing session", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			mockLanguageModel.create.mockResolvedValue(mockSession);

			await service.createSession("alarion", {
				language: "en",
				initialPrompts: [],
			});

			expect(service.hasSession("alarion")).toBe(true);
		});
	});

	describe("destroySession", () => {
		it("should destroy specific session", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const mockSession = { prompt: vi.fn(), destroy: vi.fn() };
			mockLanguageModel.create.mockResolvedValue(mockSession);

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

	describe("destroyAllSessions", () => {
		it("should destroy all sessions", async () => {
			mockLanguageModel.availability.mockResolvedValue("readily");
			const alarionSession = { prompt: vi.fn(), destroy: vi.fn() };
			const rainwalkerSession = { prompt: vi.fn(), destroy: vi.fn() };

			mockLanguageModel.create
				.mockResolvedValueOnce(alarionSession)
				.mockResolvedValueOnce(rainwalkerSession);

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
