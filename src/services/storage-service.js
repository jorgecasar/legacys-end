import { logger } from "./logger-service.js";

/**
 * Storage Interface (Implicit)
 * @typedef {Object} StorageAdapter
 * @property {function(string): import('./interfaces.js').JsonValue} getItem
 * @property {function(string, import('./interfaces.js').JsonValue): void} setItem
 * @property {function(string): void} removeItem
 * @property {function(): void} clear
 */

/**
 * LocalStorageAdapter
 * Concrete implementation of StorageAdapter using browser localStorage.
 * Handles JSON serialization/deserialization automatically.
 */
export class LocalStorageAdapter {
	/**
	 * Private getter for browser localStorage
	 * @returns {Storage}
	 */
	get #storage() {
		return window.localStorage;
	}

	/**
	 * Get item from storage.
	 * Parses JSON automatically.
	 * @param {string} key - The key to retrieve
	 * @returns {import('./interfaces.js').JsonValue | null} Parsed value or null if not found or error
	 */
	getItem(key) {
		try {
			const item = this.#storage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (e) {
			logger.error(`Error getting item ${key} from storage:`, e);
			return null;
		}
	}

	/**
	 * Set item in storage.
	 * Stringifies value to JSON automatically.
	 * @param {string} key - The key to set
	 * @param {import('./interfaces.js').JsonValue} value - The value to store
	 */
	setItem(key, value) {
		try {
			const serialized = JSON.stringify(value);
			this.#storage.setItem(key, serialized);
		} catch (e) {
			logger.error(`Error setting item ${key} in storage:`, e);
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
			logger.error(`Error removing item ${key} from storage:`, e);
		}
	}

	/**
	 * Clear all items from storage.
	 */
	clear() {
		try {
			this.#storage.clear();
		} catch (e) {
			logger.error("Error clearing storage:", e);
		}
	}
}
