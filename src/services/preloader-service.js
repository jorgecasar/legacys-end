/**
 * Service responsible for preloading assets to ensure smooth transitions.
 */
export class PreloaderService {
	/**
	 * Preload a single image
	 * @param {string} url
	 * @returns {Promise<void>}
	 */
	preloadImage(url) {
		return new Promise((resolve, _reject) => {
			const start = performance.now();
			const img = new Image();
			img.src = url;
			img.onload = () => {
				const duration = Math.round(performance.now() - start);
				console.log(`[Perf] 🖼️ Loaded image: ${url} (${duration}ms)`);
				resolve();
			};
			img.onerror = () => {
				console.warn(`[Perf] ❌ Failed to preload: ${url}`);
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

	/**
	 * Preload assets for a chapter
	 * Extracts asset URLs from chapter data
	 * @param {import("../content/quests/quest-types.js").Chapter | undefined} chapter
	 * @returns {Promise<void>}
	 */
	async preloadChapter(chapter) {
		if (!chapter) return;

		const assetsToLoad = [];

		if (chapter.background) {
			assetsToLoad.push(chapter.background);
		}

		// Add other assets here (e.g., character images, item icons) if they are in the chapter data
		// For now, we mainly focus on large background images

		if (assetsToLoad.length > 0) {
			await this.preloadImages(assetsToLoad);
		}
	}
}

export const preloader = new PreloaderService();
