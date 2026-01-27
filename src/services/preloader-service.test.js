import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreloaderService } from "./preloader-service.js";

// Mock Logger
const { mockLogger } = vi.hoisted(() => ({
	mockLogger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("./logger-service.js", () => ({
	logger: mockLogger,
}));

describe("PreloaderService", () => {
	/** @type {PreloaderService} */
	let service;
	/** @type {any} */
	let originalImage;

	beforeEach(() => {
		service = new PreloaderService();
		// Mock global Image
		originalImage = window.Image;
		// @ts-expect-error - Mocking Image for test
		window.Image = class {
			constructor() {
				/** @type {(() => void) | null} */
				this.onload = null;
				/** @type {(() => void) | null} */
				this.onerror = null;
				this._src = "";
			}
			set src(val) {
				this._src = val;
				// Simulate async load
				setTimeout(() => {
					if (val.includes("fail")) {
						this.onerror?.();
					} else {
						this.onload?.();
					}
				}, 10);
			}
			get src() {
				return this._src;
			}
		};
	});

	afterEach(() => {
		window.Image = originalImage;
	});

	it("should preload an image successfully", async () => {
		const promise = service.preloadImage("valid-image.jpg");
		await expect(promise).resolves.toBeUndefined();
		expect(mockLogger.debug).toHaveBeenCalledWith(
			expect.stringContaining("Loaded image: valid-image.jpg"),
		);
	});

	it("should resolve gracefully even if image fails", async () => {
		const promise = service.preloadImage("fail.jpg");
		await expect(promise).resolves.toBeUndefined();
		expect(mockLogger.warn).toHaveBeenCalledWith(
			expect.stringContaining("Failed to preload"),
		);
	});

	it("should preload multiple images", async () => {
		const promise = service.preloadImages(["img1.jpg", "img2.jpg"]);
		await expect(promise).resolves.toHaveLength(2);
	});

	it("should preload chapter assets", async () => {
		const chapter = {
			id: "test",
			title: "Test",
			background: "chapter-bg.jpg",
		};
		const spy = vi.spyOn(service, "preloadImages");
		await service.preloadChapter(/** @type {any} */ (chapter));
		expect(spy).toHaveBeenCalledWith(["chapter-bg.jpg"]);
	});

	it("should do nothing if chapter has no assets", async () => {
		const chapter = {
			id: "test",
			title: "Test",
		};
		const spy = vi.spyOn(service, "preloadImages");
		await service.preloadChapter(/** @type {any} */ (chapter));
		expect(spy).not.toHaveBeenCalled();
	});
});
