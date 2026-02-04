/**
 * @typedef {import('../interfaces.js').IStorageAdapter} IStorageAdapter
 */

export class MemoryStorageAdapter {
	constructor() {
		this.store = new Map();
	}

	/**
	 * @param {string} key
	 */
	getItem(key) {
		const val = this.store.get(key);
		return val === undefined ? null : JSON.parse(val);
	}

	/**
	 * @param {string} key
	 * @param {any} value
	 */
	setItem(key, value) {
		this.store.set(key, JSON.stringify(value));
	}

	/**
	 * @param {string} key
	 */
	removeItem(key) {
		this.store.delete(key);
	}

	clear() {
		this.store.clear();
	}
}
