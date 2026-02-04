import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "./logger-service.js";

describe("LoggerService", () => {
	/** @type {LoggerService} */
	let logger;
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(console, "debug").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("should initialize with default 'info' level in development", () => {
		logger = new LoggerService({ env: "development" });
		expect(logger.level).toBe("info");
	});

	it("should prioritize 'warn' level in test environment by default", () => {
		logger = new LoggerService({ env: "test" });
		expect(logger.level).toBe("warn");
	});

	it("should allow override level even in test environment", () => {
		logger = new LoggerService({ level: "debug", env: "test" });
		expect(logger.level).toBe("debug");
	});

	it("should correctly determine if a log should happen", () => {
		logger = new LoggerService({ level: "warn" });

		expect(logger.shouldLog("error")).toBe(true); // 3 >= 2
		expect(logger.shouldLog("warn")).toBe(true); // 2 >= 2
		expect(logger.shouldLog("info")).toBe(false); // 1 < 2
		expect(logger.shouldLog("debug")).toBe(false); // 0 < 2
	});

	describe("Logging Methods", () => {
		beforeEach(() => {
			logger = new LoggerService({ level: "debug" });
		});

		it("should log debug messages", () => {
			logger.debug("debug msg");
			expect(console.debug).toHaveBeenCalledWith("[DEBUG] debug msg");
		});

		it("should log info messages", () => {
			logger.info("info msg", 123);
			expect(console.info).toHaveBeenCalledWith("[INFO] info msg", 123);
		});

		it("should log warn messages", () => {
			logger.warn("warn msg");
			expect(console.warn).toHaveBeenCalledWith("[WARN] warn msg");
		});

		it("should log error messages", () => {
			logger.error("error msg");
			expect(console.error).toHaveBeenCalledWith("[ERROR] error msg");
		});

		it("should respect silent mode", () => {
			logger = new LoggerService({ level: "silent" });
			logger.error("should not see this");
			expect(console.error).not.toHaveBeenCalled();
		});
	});
});
