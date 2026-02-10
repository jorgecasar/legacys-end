/**
 * LocalStorageAdapter
 */

/**
 * LocalStorageAdapter
 * Concrete implementation of StorageAdapter using browser localStorage.
 * Handles JSON serialization/deserialization automatically.
 * @implements {IStorageAdapter}
 */
export class LocalStorageAdapter {
	/**
	 * @param {object} [options] - Options for the LocalStorageAdapter.
	 * @param {ILoggerService} [options.logger] - Logger service instance.
	 */
	constructor(options = {}) {
		/** @private @type {ILoggerService | undefined} */
		this.logger = options.logger;
	}

	/**
	 * Private getter for browser localStorage.
	 * @returns {Storage} The browser's localStorage object.
	 */
	get #storage() {
		return window.localStorage;
	}

	/**
	 * Get item from storage.
	 * Parses JSON automatically.
	 * @param {string} key - The key to retrieve
	 * @returns {JSONSerializable | null} Parsed value or null if not found or error
	 */

	getItem(key) {
		try {
			const item = this.#storage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (e) {
			this.logger?.error(`Error getting item ${key} from storage:`, e);
			return null;
		}
	}

	/**
	 * Set item in storage.
	 * Stringifies value to JSON automatically.
	 * @param {string} key - The key to set
	 * @param {import('../types/common.d.js').JsonValue} value - The value to store
	 */
	setItem(key, value) {
		try {
			const serialized = JSON.stringify(value);
			this.#storage.setItem(key, serialized);
		} catch (e) {
			this.logger?.error(`Error setting item ${key} in storage:`, e);
		}
	}

	/**
	 * Remove item from storage.
	 * @param {string} key - The key to remove
	 */
	removeItem(key) {
		try {
			this.#storage.removeItem(key);
		} catch (e) {
			this.logger?.error(`Error removing item ${key} from storage:`, e);
		}
	}

	/**
	 * Clear all items from storage.
	 * Removes all key-value pairs from the underlying storage.
	 * @returns {void}
	 */
	clear() {
		try {
			this.#storage.clear();
		} catch (e) {
			this.logger?.error("Error clearing storage:", e);
		}
	}
}
