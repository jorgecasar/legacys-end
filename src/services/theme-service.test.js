import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeService } from "./theme-service.js";

describe("ThemeService", () => {
	/** @type {ThemeService} */
	let service;
	/** @type {any} */
	let mockStorage;

	beforeEach(() => {
		mockStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
		};
		// Reset DOM
		document.documentElement.className = "";

		// Mock matchMedia
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should initialize with default system theme if no storage", () => {
		mockStorage.getItem.mockReturnValue(null);
		service = new ThemeService({ storage: mockStorage });

		expect(service.themeMode.get()).toBe("system");
		expect(mockStorage.getItem).toHaveBeenCalledWith("legacys-end-theme");
		// Should check root element, and should default to light if match media says so (mocked false)
		expect(document.documentElement.classList.contains("wa-light")).toBe(true);
		expect(document.documentElement.classList.contains("wa-theme-pixel")).toBe(
			true,
		);
	});

	it("should initialize with stored theme", () => {
		mockStorage.getItem.mockReturnValue("dark");
		service = new ThemeService({ storage: mockStorage });

		expect(service.themeMode.get()).toBe("dark");
		expect(document.documentElement.classList.contains("wa-dark")).toBe(true);
	});

	it("should set theme and update storage/DOM", () => {
		mockStorage.getItem.mockReturnValue("light");
		service = new ThemeService({ storage: mockStorage });
		mockStorage.setItem.mockClear();

		service.setTheme("dark");

		expect(service.themeMode.get()).toBe("dark");
		expect(mockStorage.setItem).toHaveBeenCalledWith(
			"legacys-end-theme",
			"dark",
		);
		expect(document.documentElement.classList.contains("wa-dark")).toBe(true);
		expect(document.documentElement.classList.contains("wa-light")).toBe(false);
	});

	it("should overwrite theme even if same (no check in set)", () => {
		mockStorage.getItem.mockReturnValue("light");
		service = new ThemeService({ storage: mockStorage });
		mockStorage.setItem.mockClear();

		service.setTheme("light");
		// Expect it TO be called because there is no optimization check in set()
		expect(mockStorage.setItem).toHaveBeenCalledWith(
			"legacys-end-theme",
			"light",
		);
	});

	it("should toggle theme", () => {
		mockStorage.getItem.mockReturnValue("light");
		service = new ThemeService({ storage: mockStorage });

		service.toggleTheme();

		expect(service.themeMode.get()).toBe("dark");
		expect(document.documentElement.classList.contains("wa-dark")).toBe(true);

		service.toggleTheme();

		expect(service.themeMode.get()).toBe("light");
		expect(document.documentElement.classList.contains("wa-light")).toBe(true);
	});

	it("should fallback to system preference if theme is 'system'", () => {
		// Mock system dark mode
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: query === "(prefers-color-scheme: dark)",
			addEventListener: vi.fn(),
		}));

		service = new ThemeService({ storage: mockStorage });
		service.setTheme("system");

		expect(service.themeMode.get()).toBe("system");
		// Should be dark because media query matches
		expect(document.documentElement.classList.contains("wa-dark")).toBe(true);
	});
});
