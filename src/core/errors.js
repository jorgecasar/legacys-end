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

/**
 * For invalid input.
 */
export class ValidationError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "VALIDATION_ERROR");
	}
}

/**
 * Result Pattern implementation for type-safe error handling.
 * @template T - Success type
 * @template E - Error type (defaults to AppError)
 */
export class Result {
	/** @type {T | null} */
	#value;
	/** @type {E | null} */
	#error;
	/** @type {boolean} */
	#ok;

	/**
	 * @param {T | null} value
	 * @param {E | null} error
	 * @param {boolean} ok
	 */
	constructor(value, error, ok) {
		this.#value = value;
		this.#error = error;
		this.#ok = ok;
	}

	/**
	 * Creates a successful Result.
	 * @template T
	 * @param {T} value
	 * @returns {Result<T, any>}
	 */
	static ok(value) {
		return new Result(value, null, true);
	}

	/**
	 * Creates a failed Result.
	 * @template E
	 * @param {E} error
	 * @returns {Result<any, E>}
	 */
	static err(error) {
		return new Result(null, error, false);
	}

	/** @returns {boolean} */
	isOk() {
		return this.#ok;
	}

	/** @returns {boolean} */
	isErr() {
		return !this.#ok;
	}

	/**
	 * @returns {T}
	 * @throws {Error} If Result is an error.
	 */
	get value() {
		if (!this.#ok) {
			throw new Error(
				"Cannot get value from an Error Result. Use isOk() first.",
			);
		}
		return /** @type {T} */ (this.#value);
	}

	/**
	 * @returns {E}
	 * @throws {Error} If Result is a success.
	 */
	get error() {
		if (this.#ok) {
			throw new Error(
				"Cannot get error from a Success Result. Use isErr() first.",
			);
		}
		return /** @type {E} */ (this.#error);
	}

	/**
	 * @template U
	 * @param {(value: T) => U} fn
	 * @returns {Result<U, E>}
	 */
	map(fn) {
		if (this.#ok) {
			return Result.ok(fn(/** @type {T} */ (this.#value)));
		}
		return Result.err(/** @type {E} */ (this.#error));
	}

	/**
	 * @template F
	 * @param {(error: E) => F} fn
	 * @returns {Result<T, F>}
	 */
	mapErr(fn) {
		if (!this.#ok) {
			return Result.err(fn(/** @type {E} */ (this.#error)));
		}
		return Result.ok(/** @type {T} */ (this.#value));
	}
}
