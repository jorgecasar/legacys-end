/**
 * @enum {number}
 */
export const LOG_LEVELS = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	silent: 4,
};

/**
 * @typedef {Object} LoggerOptions
 * @property {keyof typeof LOG_LEVELS} [level='warn'] - Initial log level
 * @property {string} [env] - Override environment (default: import.meta.env.MODE)
 */

/**
 * @typedef {import('../types/services.d.js').ILoggerService} ILoggerService
 */

/**
 * Logger Service
 * Centralized logging with levels and structured output
 * @implements {ILoggerService}
 */
export class LoggerService {
	/** @type {string} */
	env;

	/** @type {keyof typeof LOG_LEVELS} */
	level;

	/**
	 * @param {LoggerOptions} [options] - Configuration options
	 */
	constructor(options = {}) {
		this.env = options.env || import.meta.env?.MODE || "development";
		this.level =
			options.level || (this.env === "development" ? "info" : "warn");
	}

	/**
	 * Check if a message with the given level should be logged.
	 * @param {keyof typeof LOG_LEVELS} level - The level of the message to check
	 * @returns {boolean} True if the message should be logged
	 */
	shouldLog(level) {
		const levelVal = LOG_LEVELS[level];
		const currentVal = LOG_LEVELS[this.level];
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
