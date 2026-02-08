/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 */

/**
 * Service responsible for preloading assets to ensure smooth transitions.
 */
export class PreloaderService {
	/**
	 * @param {Object} [options]
	 * @param {ILoggerService} [options.logger]
	 */
	constructor(options = {}) {
		this.logger = options.logger;
	}
	/**
	 * Preload a single image
	 * @param {string} url
	 * @returns {Promise<void>}
	 */
	preloadImage(url) {
		return new Promise((resolve, _reject) => {
			const img = new Image();
			img.src = url;
			img.onload = () => {
				this.logger?.debug(`[Perf] 🖼️ Loaded image: ${url}`);
				resolve();
			};
			img.onerror = () => {
				this.logger?.warn(`[Perf] ❌ Failed to preload: ${url}`);
				resolve();
			};
		});
	}

	/**
	 * Preload a list of images
	 * @param {string[]} urls
	 * @returns {Promise<void[]>}
	 */
	preloadImages(urls) {
		return Promise.all(urls.map((url) => this.preloadImage(url)));
	}
}
