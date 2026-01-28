export const LogLevel = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
};

/**
 * @typedef {Object} LoggerOptions
 * @property {('debug'|'info'|'warn'|'error'|'silent')} [level='warn'] - Initial log level
 * @property {boolean} [force=false] - If true, overrides environment default levels
 * @property {string} [env] - Override environment (default: import.meta.env.MODE)
 */

/**
 * @typedef {import('./interfaces.js').ILoggerService} ILoggerService
 */

/**
 * Logger Service
 * Centralized logging with levels and structured output
 * @implements {ILoggerService}
 */
export class LoggerService {
	/**
	 * @param {LoggerOptions} [options] - Configuration options
	 */
	constructor(options = {}) {
		this.env = options.env || import.meta.env?.MODE || "development";

		/** @type {Object.<string, number>} key-value map for log level priorities */
		this.levels = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
			silent: 4,
		};

		/** @type {string} Current active log level */
		this.level =
			options.level || (this.env === "development" ? "info" : "warn");
	}

	/**
	 * Check if a message with the given level should be logged.
	 * @param {string} level - The level of the message to check
	 * @returns {boolean} True if the message should be logged
	 */
	shouldLog(level) {
		const levelVal = this.levels[level];
		const currentVal = this.levels[this.level];
		if (levelVal === undefined || currentVal === undefined) return false;
		return levelVal >= currentVal;
	}

	/**
	 * Log a debug message (lowest priority).
	 * @param {string} message - The message to log
	 * @param {...unknown} args - Additional arguments to log
	 */
	debug(message, ...args) {
		if (this.shouldLog("debug")) {
			console.debug(`[DEBUG] ${message}`, ...args);
		}
	}

	/**
	 * Log an info message.
	 * @param {string} message - The message to log
	 * @param {...unknown} args - Additional arguments to log
	 */
	info(message, ...args) {
		if (this.shouldLog("info")) {
			console.info(`[INFO] ${message}`, ...args);
		}
	}

	/**
	 * Log a warning message.
	 * @param {string} message - The message to log
	 * @param {...unknown} args - Additional arguments to log
	 */
	warn(message, ...args) {
		if (this.shouldLog("warn")) {
			console.warn(`[WARN] ${message}`, ...args);
		}
	}

	/**
	 * Log an error message (highest priority).
	 * @param {string} message - The message to log
	 * @param {...unknown} args - Additional arguments to log
	 */
	error(message, ...args) {
		if (this.shouldLog("error")) {
			console.error(`[ERROR] ${message}`, ...args);
		}
	}
}

export const logger = new LoggerService();
