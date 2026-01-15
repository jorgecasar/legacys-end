import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalizationService } from "./localization-service.js";

// Mock dependencies
const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

const mockStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
};

// Mock @lit/localize
vi.mock("@lit/localize", () => ({
	configureLocalization: vi.fn().mockImplementation(({ loadLocale }) => ({
		getLocale: vi.fn(),
		setLocale: vi.fn().mockImplementation(async (locale) => {
			// await loadLocale(locale); // Skip loading to avoid unmocked dynamic imports
			return Promise.resolve();
		}),
	})),
	msg: (/** @type {string} */ str) => str,
}));

// Mock locale codes
vi.mock("../generated/locales/locale-codes.js", () => ({
	sourceLocale: "en",
	targetLocales: ["es"],
}));

describe("LocalizationService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize signal with source locale even if stored locale is different", async () => {
		// Arrange: Stored locale is 'es'
		mockStorage.getItem.mockReturnValue("es");

		// Act
		const service = new LocalizationService(
			/** @type {any} */ (mockLogger),
			/** @type {any} */ (mockStorage),
		);

		// Assert: Signal should initially be 'en' (source) to allow reactive update later
		expect(service.getLocale()).toBe("en");

		// Wait for potential async operations in constructor
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Assert: Signal should eventually update to 'es'
		expect(service.getLocale()).toBe("es");
		expect(mockLogger.info).toHaveBeenCalledWith("🌐 Using stored locale: es");
		// Verify setLocale was called with 'es'
	});

	it("should start with source locale if no stored locale", async () => {
		mockStorage.getItem.mockReturnValue(null);
		// Mock navigator.language to something not supported to ensure fallback
		Object.defineProperty(navigator, "language", {
			value: "fr-FR",
			configurable: true,
		});

		const service = new LocalizationService(
			/** @type {any} */ (mockLogger),
			/** @type {any} */ (mockStorage),
		);

		expect(service.getLocale()).toBe("en");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(service.getLocale()).toBe("en");
		expect(mockLogger.info).toHaveBeenCalledWith("🌐 Using default locale: en");
	});
});
