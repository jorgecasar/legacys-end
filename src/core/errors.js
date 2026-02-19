/**
 * Base class for all application errors.
 */
export class AppError extends Error {
	/**
	 * @param {string} message - Human-readable error message.
	 * @param {string} [code] - Machine-readable error code.
	 */
	constructor(message, code) {
		super(message);
		this.name = this.constructor.name;
		this.code = code || "INTERNAL_ERROR";
		if (typeof (/** @type {any} */ (Error).captureStackTrace) === "function") {
			/** @type {any} */ (Error).captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Specifically for business logic violations.
 */
export class DomainError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "DOMAIN_ERROR");
	}
}

/**
 * For missing resources.
 */
export class NotFoundError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "NOT_FOUND");
	}
}
