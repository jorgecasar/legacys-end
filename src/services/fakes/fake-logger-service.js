import { vi } from "vitest";

/**
 * @typedef {import('../../types/services.d.js').ILoggerService} ILoggerService */

export class FakeLoggerService {
	constructor() {
		this.debug = vi.fn();
		this.info = vi.fn();
		this.warn = vi.fn();
		this.error = vi.fn();
	}
}
