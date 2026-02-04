import { vi } from "vitest";

/** @typedef {import('../interfaces.js').ILoggerService} ILoggerService */

/**
 * FakeLoggerService
 * A reusable mock logger for tests. All methods are Vitest spies.
 * @implements {ILoggerService}
 */
export class FakeLoggerService {
	constructor() {
		this.debug = vi.fn();
		this.info = vi.fn();
		this.warn = vi.fn();
		this.error = vi.fn();
	}
}
