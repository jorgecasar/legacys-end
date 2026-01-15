import { Signal } from "@lit-labs/signals";
import { ThemeModeValidator } from "../utils/validators.js";

/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * ThemeService
 * Manages the application-wide visual theme.
 */
export class ThemeService {
	/**
	 * @param {import('./logger-service.js').LoggerService} logger
	 * @param {import('./storage-service.js').StorageAdapter} storage
	 */
	constructor(logger, storage) {
		this.logger = logger;
		this.storage = storage;
		this.storageKey = "legacys-end-theme";

		/** @type {Signal.State<ThemeMode>} */
		this.themeMode = new Signal.State(this.#loadStoredTheme());

		// Apply initial theme
		this.#applyTheme(this.themeMode.get());
	}

	/**
	 * Sets the theme mode.
	 * @param {ThemeMode} mode
	 */
	setTheme(mode) {
		const validation = ThemeModeValidator.validate(mode);
		if (!validation.isValid) {
			this.logger.warn(`Invalid theme mode: ${mode}`);
			return;
		}

		this.themeMode.set(mode);
		this.storage.setItem(this.storageKey, mode);
		this.#applyTheme(mode);
		this.logger.info(`🎨 Theme switched to: ${mode}`);
	}

	/**
	 * Toggles between light and dark mode.
	 * System mode is ignored in toggle.
	 */
	toggleTheme() {
		const current = this.themeMode.get();
		const next = current === "dark" ? "light" : "dark";
		this.setTheme(next);
	}

	/**
	 * Loads stored theme or defaults to 'system'
	 * @returns {ThemeMode}
	 */
	#loadStoredTheme() {
		const stored = this.storage.getItem(this.storageKey);
		if (
			typeof stored === "string" &&
			ThemeModeValidator.validate(stored).isValid
		) {
			return /** @type {ThemeMode} */ (stored);
		}
		return "system";
	}

	/**
	 * Applies the theme to the DOM (documentElement)
	 * @param {ThemeMode} mode
	 */
	#applyTheme(mode) {
		const root = document.documentElement;
		root.classList.remove("wa-dark", "wa-light");

		let effectiveMode = mode;
		if (mode === "system") {
			effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}

		root.classList.add(`wa-${effectiveMode}`);
		// Ensure the base pixel theme class is present
		if (!root.classList.contains("wa-theme-pixel")) {
			root.classList.add("wa-theme-pixel");
		}
	}
}
