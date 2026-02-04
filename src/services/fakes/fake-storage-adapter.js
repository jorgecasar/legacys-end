import { vi } from "vitest";

/**
 * @typedef {import('../interfaces.js').IStorageAdapter} IStorageAdapter
 */

/**
 * FakeStorageAdapter
 * A mock implementation of IStorageAdapter for testing purposes.
 * Utilizes Vitest spies for all methods.
 * @implements {IStorageAdapter}
 */
export class FakeStorageAdapter {
	constructor() {
		this.getItem = vi.fn();
		this.setItem = vi.fn();
		this.removeItem = vi.fn();
		this.clear = vi.fn();
	}
}
