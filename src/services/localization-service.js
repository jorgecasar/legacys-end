import { configureLocalization } from "@lit/localize";
import { Signal } from "@lit-labs/signals";
import {
	sourceLocale,
	targetLocales,
} from "../generated/locales/locale-codes.js";

/**
 * LocalizationService
 * Manages application locale and translation loading.
 */
export class LocalizationService {
	/**
	 * @param {import('./logger-service.js').LoggerService} logger
	 * @param {import('./storage-service.js').StorageAdapter} storage
	 */
	constructor(logger, storage) {
		this.logger = logger;
		this.storage = storage;
		this.storageKey = "legacys-end-locale";
		/** @type {Set<() => void>} */
		this.listeners = new Set();

		// Initialize @lit/localize
		const { getLocale, setLocale } = configureLocalization({
			sourceLocale,
			targetLocales,
			loadLocale: (locale) => {
				/** @type {Record<string, () => Promise<import('@lit/localize').LocaleModule>>} */
				const loaders = {
					es: () => import("../generated/locales/es.js"),
				};
				const loader = loaders[locale];
				return loader ? loader() : Promise.resolve(/** @type {any} */ ({}));
			},
		});

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
			this.logger.info(`🌐 Using stored locale: ${storedLocale}`);
		} else if (browserLocale && this.isValidLocale(browserLocale)) {
			initialLocale = browserLocale;
			this.logger.info(`🌐 Detected browser locale: ${browserLocale}`);
		} else {
			this.logger.info(`🌐 Using default locale: ${sourceLocale}`);
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
		const langCode = browserLang.split("-")[0].toLowerCase();

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
	 * Set the locale
	 * @param {string} locale
	 */
	async setLocale(locale) {
		if (locale !== sourceLocale && !targetLocales.includes(locale)) {
			this.logger.warn(`⚠️ Locale '${locale}' not supported.`);
			return;
		}

		try {
			// Update lang attribute immediately
			document.documentElement.lang = locale;
			await this._setLocale(locale);
			this._localeSignal.set(locale);
			this.storage.setItem(this.storageKey, locale);
			this.logger.info(`🌐 Locale switched to: ${locale}`);
			this.listeners.forEach((cb) => {
				cb();
			});
		} catch (e) {
			this.logger.error(`❌ Failed to set locale to '${locale}':`, e);
		}
	}

	/**
	 * Get stored locale or default
	 * @returns {string|null}
	 */
	getStoredLocale() {
		return /** @type {string|null} */ (this.storage.getItem(this.storageKey));
	}

	/**
	 * @param {() => void} callback
	 */
	onLocaleChange(callback) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
}
