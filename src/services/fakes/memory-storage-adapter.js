/**
 * @typedef {import('../../types/services.d.js').IStorageAdapter} IStorageAdapter
 * @typedef {import('../../types/common.d.js').JsonValue} JsonValue
 */

export class MemoryStorageAdapter {
	constructor() {
		/** @type {Map<string, JsonValue>} */
		this.storage = new Map();
	}

	/**
	 * @param {string} key
	 * @returns {JsonValue | null}
	 */
	getItem(key) {
		return this.storage.get(key) || null;
	}

	/**
	 * @param {string} key
	 * @param {JsonValue} value
	 */
	setItem(key, value) {
		this.storage.set(key, value);
	}

	/**
	 * @param {string} key
	 */
	removeItem(key) {
		this.storage.delete(key);
	}

	/**
	 * @returns {void}
	 */
	clear() {
		this.storage.clear();
	}
}
