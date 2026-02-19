/**
 * @file Defines the Result pattern and custom error types for the application.
 * @module core/errors
 */

/**
 * A simple Result class to handle success and failure scenarios.
 * Avoids throwing exceptions for predictable errors.
 *
 * @template T - The type of the value on success.
 * @template E - The type of the error on failure.
 */
export class Result {
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

		this.isSuccess = isSuccess;
		this.isFailure = !isSuccess;
		this.error = error;
		this.value = value;

		Object.freeze(this);
	}

	/**
	 * Creates a success Result.
	 * @template U
	 * @param {U} [value] - The success value.
	 * @returns {Result<U, never>}
	 */
	static ok(value) {
		return /** @type {Result<U, never>} */ (new Result(true, null, value));
	}

	/**
	 * Creates a failure Result.
	 * @template F
	 * @param {F} error - The error.
	 * @returns {Result<never, F>}
	 */
	static error(error) {
		return /** @type {Result<never, F>} */ (new Result(false, error, null));
	}
}

/**
 * Base class for application-specific errors.
 */
export class AppError extends Error {
	/**
	 * @param {string} message - The error message.
	 */
	constructor(message) {
		super(message);
		this.name = "AppError";
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
		super(message);
		this.name = "ValidationError";
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
		super(message);
		this.name = "NetworkError";
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
	constructor(message, code) {
		super(message);
		this.name = "DomainError";
		this.code = code;
	}
}
