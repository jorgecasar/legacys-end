import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAssetPath } from "./asset-path.js";

describe("getAssetPath", () => {
	const originalBaseUrl = import.meta.env.BASE_URL;

	afterEach(() => {
		// Restore original BASE_URL
		vi.stubEnv("BASE_URL", originalBaseUrl);
	});

	it("should return path as-is if in development (empty base)", () => {
		vi.stubEnv("BASE_URL", "/");
		const path = "/assets/image.png";
		expect(getAssetPath(path)).toBe("/assets/image.png");
	});

	it("should prepend base URL if not present", () => {
		vi.stubEnv("BASE_URL", "/legacys-end/");
		const path = "/assets/image.png";
		expect(getAssetPath(path)).toBe("/legacys-end/assets/image.png");
	});

	it("should not prepend base URL if already present", () => {
		vi.stubEnv("BASE_URL", "/legacys-end/");
		const path = "/legacys-end/assets/image.png";
		expect(getAssetPath(path)).toBe("/legacys-end/assets/image.png");
	});

	it("should handle paths without leading slash", () => {
		vi.stubEnv("BASE_URL", "/legacys-end/");
		const path = "assets/image.png";
		expect(getAssetPath(path)).toBe("/legacys-end/assets/image.png");
	});

	it("should handle empty path", () => {
		vi.stubEnv("BASE_URL", "/legacys-end/");
		expect(getAssetPath("")).toBe("/legacys-end/");
	});
});
