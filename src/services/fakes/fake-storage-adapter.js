import { vi } from "vitest";

/**
 * @typedef {import('../../types/services.d.js').IStorageAdapter} IStorageAdapter
 */
/** @typedef {import('../../types/services.d.js').ILoggerService} ILoggerService */

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
