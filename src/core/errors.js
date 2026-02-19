/**
 * @file Defines the Result pattern and custom error types for the application.
 * @module core/errors
 */

/**
 * A Result class to handle success and failure scenarios.
 * Avoids throwing exceptions for predictable errors.
 *
 * @template T - The type of the value on success.
 * @template E - The type of the error on failure.
 */
export class Result {
	/** @type {T | null} */
	#value;
	/** @type {E | null} */
	#error;
	/** @type {boolean} */
	#isSuccess;

	/**
	 * @param {boolean} isSuccess
	 * @param {E | null} error
	 * @param {T | null} value
	 */
	constructor(isSuccess, error, value) {
		if (isSuccess && error) {
			throw new Error(
				"InvalidOperation: A result cannot be successful and contain an error.",
			);
		}
		if (!isSuccess && !error) {
			throw new Error(
				"InvalidOperation: A failing result needs to contain an error.",
			);
		}

		this.#isSuccess = isSuccess;
		this.#error = error;
		this.#value = value;

		Object.freeze(this);
	}

	/**
	 * Creates a success Result.
	 * @template U
	 * @param {U | null} [value] - The success value.
	 * @returns {Result<U, any>}
	 */
	static ok(value = null) {
		return new Result(true, null, value);
	}

	/**
	 * Creates a failure Result.
	 * @template F
	 * @param {F} error - The error.
	 * @returns {Result<any, F>}
	 */
	static err(error) {
		return new Result(false, error, null);
	}

	/**
	 * Backward compatibility alias for static err()
	 * @deprecated Use Result.err() instead
	 * @param {any} error
	 */
	static error(error) {
		return Result.err(error);
	}

	/** @returns {boolean} */
	isOk() {
		return this.#isSuccess;
	}

	/** @returns {boolean} */
	isErr() {
		return !this.#isSuccess;
	}

	/**
	 * @returns {boolean}
	 * @deprecated Use isOk() instead
	 */
	get isSuccess() {
		return this.#isSuccess;
	}

	/**
	 * @returns {boolean}
	 * @deprecated Use isErr() instead
	 */
	get isFailure() {
		return !this.#isSuccess;
	}

	/**
	 * @returns {T}
	 * @throws {Error} If Result is an error.
	 */
	get value() {
		if (!this.#isSuccess) {
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
		if (this.#isSuccess) {
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
		if (this.#isSuccess) {
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
		if (!this.#isSuccess) {
			return Result.err(fn(/** @type {E} */ (this.#error)));
		}
		return Result.ok(/** @type {T} */ (this.#value));
	}
}

/**
 * Base class for application-specific errors.
 */
export class AppError extends Error {
	/**
	 * @param {string} message - The error message.
	 * @param {string} [code] - Machine-readable error code.
	 */
	constructor(message, code = "INTERNAL_ERROR") {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		if (typeof (/** @type {any} */ (Error).captureStackTrace) === "function") {
			/** @type {any} */ (Error).captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Represents an error validating input data.
 */
export class ValidationError extends AppError {
	/**
	 * @param {string} message - The error message.
	 */
	constructor(message) {
		super(message, "VALIDATION_ERROR");
	}
}

/**
 * Represents a network-related error.
 */
export class NetworkError extends AppError {
	/**
	 * @param {string} message - The error message.
	 */
	constructor(message) {
		super(message, "NETWORK_ERROR");
	}
}

/**
 * Represents a domain-specific error.
 */
export class DomainError extends AppError {
	/**
	 * @param {string} message - The error message.
	 * @param {string} [code] - An optional error code.
	 */
	constructor(message, code = "DOMAIN_ERROR") {
		super(message, code);
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
	constructor(message, code = "NOT_FOUND") {
		super(message, code);
	}
}
