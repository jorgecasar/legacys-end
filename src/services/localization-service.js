import { configureLocalization } from "@lit/localize";
import { Signal } from "@lit-labs/signals";
import {
	sourceLocale,
	targetLocales,
} from "../generated/locales/locale-codes.js";

/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../types/services.d.js').IStorageAdapter} IStorageAdapter
 * @typedef {Object} LocalizationServiceParams
 * @property {IStorageAdapter} storage
 * @property {ILoggerService|undefined} [logger]
 */
/** @type {ReturnType<typeof configureLocalization>} */
let localizationConfig;

/**
 * LocalizationService
 * Manages application locale and translation loading.
 */
export class LocalizationService {
	/** @type {ILoggerService | undefined} */
	#logger;

	/** @type {IStorageAdapter | undefined} */
	#storage;

	/** @type {string} */
	#storageKey;

	/**
	 * @param {LocalizationServiceParams} params
	 */
	constructor({ storage, logger }) {
		this.#storage = storage;
		this.#logger = logger;
		this.#storageKey = "legacys-end-locale";
		/** @type {Set<() => void>} */
		this.listeners = new Set();

		// Initialize @lit/localize (only once)
		if (!localizationConfig) {
			localizationConfig = configureLocalization({
				sourceLocale,
				targetLocales,
				loadLocale: (locale) => {
					/** @type {Record<string, () => Promise<import('@lit/localize').LocaleModule>>} */
					const loaders = {
						es: () => import("../generated/locales/es.js"),
					};
					const loader = loaders[locale];
					return loader
						? loader()
						: Promise.resolve(
								/** @type {import('@lit/localize').LocaleModule} */ (
									/** @type {unknown} */ ({
										templates: {},
									})
								),
							);
				},
			});
		}

		const { getLocale, setLocale } = localizationConfig;

		this._getLocale = getLocale;
		this._setLocale = setLocale;

		// Determine initial locale with priority:
		// 1. Stored locale (if valid)
		// 2. Browser language (if supported)
		// 3. Source locale (fallback)
		const storedLocale = this.getStoredLocale();
		const browserLocale = this.detectBrowserLocale();

		let initialLocale = sourceLocale;

		if (storedLocale && this.isValidLocale(storedLocale)) {
			initialLocale = storedLocale;
			this.#logger?.info(`🌐 Using stored locale: ${storedLocale}`);
		} else if (browserLocale && this.isValidLocale(browserLocale)) {
			initialLocale = browserLocale;
			this.#logger?.info(`🌐 Detected browser locale: ${browserLocale}`);
		} else {
			this.#logger?.info(`🌐 Using default locale: ${sourceLocale}`);
		}

		this._localeSignal = new Signal.State(sourceLocale);

		// Set initial locale
		this.setLocale(initialLocale);
	}

	/**
	 * Detect the best matching locale from browser settings
	 * @returns {string|null}
	 */
	detectBrowserLocale() {
		const browserLang = navigator.language;
		if (!browserLang) return null;

		// Try exact match first (e.g., "es-ES" -> "es")
		const parts = browserLang.split("-");
		const langCode = parts[0]?.toLowerCase();
		if (!langCode) return null;

		// Check if the language code matches any supported locale
		if (langCode === sourceLocale || targetLocales.includes(langCode)) {
			return langCode;
		}

		return null;
	}

	/**
	 * Check if a locale is valid (supported)
	 * @param {string} locale
	 * @returns {boolean}
	 */
	isValidLocale(locale) {
		return locale === sourceLocale || targetLocales.includes(locale);
	}

	/**
	 * Get the current locale value
	 * @returns {string}
	 */
	getLocale() {
		return this._localeSignal.get();
	}

	/**
	 * Translate a key using @lit/localize msg()
	 * @param {string} key
	 * @returns {string}
	 */
	t(key) {
		// msg() is usually used directly in templates, but service can provide a wrapper
		// if needed for non-template translations.
		// For now, we return the key or look into a more robust way to use msg() here.
		return key;
	}

	/**
	 * Set the locale
	 * @param {string} locale
	 */
	async setLocale(locale) {
		if (locale !== sourceLocale && !targetLocales.includes(locale)) {
			this.#logger?.warn(`⚠️ Locale '${locale}' not supported.`);
			return;
		}

		try {
			// Update lang attribute immediately
			document.documentElement.lang = locale;
			await this._setLocale(locale);
			this._localeSignal.set(locale);
			this.#storage?.setItem(this.#storageKey, locale);
			this.#logger?.info(`🌐 Locale switched to: ${locale}`);
			this.listeners.forEach((cb) => {
				cb();
			});
		} catch (e) {
			this.#logger?.error(`❌ Failed to set locale to '${locale}':`, e);
		}
	}

	/**
	 * Get stored locale or default
	 * @returns {string|null}
	 */
	getStoredLocale() {
		return /** @type {string|null} */ (
			this.#storage?.getItem(this.#storageKey)
		);
	}

	/**
	 * @param {() => void} callback
	 */
	onLocaleChange(callback) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
}
