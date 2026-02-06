import { Signal } from "@lit-labs/signals";
import { StorageKeys, ThemeModes } from "../core/constants.js";
import { ThemeModeValidator } from "../utils/validators.js";

/**
 * @typedef {import('../types/services.d.js').ThemeMode} ThemeMode
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/services.d.js').IStorageAdapter} IStorageAdapter
 */

/**
 * ThemeService
 * Manages the application-wide visual theme.
 */
export class ThemeService {
	/**
	 * @type {ILoggerService | undefined}
	 */
	#logger;

	/**
	 * @type {IStorageAdapter | undefined}
	 */
	#storage;

	/**
	 * @type {string}
	 */
	#storageKey;

	/**
	 * @param {Object} params
	 * @param {ILoggerService} [params.logger]
	 * @param {IStorageAdapter} [params.storage]
	 */
	constructor({ logger, storage }) {
		this.#logger = logger;
		this.#storage = storage;
		this.#storageKey = StorageKeys.THEME;

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
			this.#logger?.warn(`Invalid theme mode: ${mode}`);
			return;
		}

		this.themeMode.set(mode);
		this.#storage?.setItem(this.#storageKey, mode);
		this.#applyTheme(mode);
		this.#logger?.info(`🎨 Theme switched to: ${mode}`);
	}

	/**
	 * Toggles between light and dark mode.
	 * System mode is ignored in toggle.
	 */
	toggleTheme() {
		const current = this.themeMode.get();
		const next =
			current === ThemeModes.DARK ? ThemeModes.LIGHT : ThemeModes.DARK;
		this.setTheme(next);
	}

	/**
	 * Loads stored theme or defaults to 'system'
	 * @returns {ThemeMode}
	 */
	#loadStoredTheme() {
		const stored = this.#storage?.getItem(this.#storageKey);
		if (
			typeof stored === "string" &&
			ThemeModeValidator.validate(stored).isValid
		) {
			return /** @type {ThemeMode} */ (stored);
		}
		return ThemeModes.SYSTEM;
	}

	/**
	 * Applies the theme to the DOM (documentElement)
	 * @param {ThemeMode} mode
	 */
	#applyTheme(mode) {
		const root = document.documentElement;
		root.classList.remove("wa-dark", "wa-light");

		let effectiveMode = mode;
		if (mode === ThemeModes.SYSTEM) {
			effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches
				? ThemeModes.DARK
				: ThemeModes.LIGHT;
		}

		root.classList.add(`wa-${effectiveMode}`);
		// Ensure the base pixel theme class is present
		if (!root.classList.contains("wa-theme-pixel")) {
			root.classList.add("wa-theme-pixel");
		}
	}
}
