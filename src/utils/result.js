import { AppError } from "../core/errors.js";

/**
 * Result pattern implementation for consistent error handling.
 * Inspired by Rust's Result<T, E> type.
 *
 * @template T
 * @template E
 */
export class Result {
	/** @type {T | null} */
	#value;
	/** @type {E | null} */
	#error;
	/** @type {boolean} */
	#isSuccess;

	/**
	 * @private
	 * @param {boolean} isSuccess
	 * @param {E | null} error
	 * @param {T | null} value
	 */
	constructor(isSuccess, error, value) {
		this.#isSuccess = isSuccess;
		this.#error = error;
		this.#value = value;
		Object.freeze(this);
	}

	get isSuccess() {
		return this.#isSuccess;
	}

	get isFailure() {
		return !this.#isSuccess;
	}

	/**
	 * @deprecated Use isSuccess
	 */
	get ok() {
		return this.#isSuccess;
	}

	/**
	 * @returns {T}
	 * @throws {Error} If this is a failure result.
	 */
	get value() {
		if (!this.#isSuccess) {
			throw new Error("Cannot get the value from a failure result.");
		}
		return /** @type {T} */ (this.#value);
	}

	/**
	 * @returns {E | null}
	 */
	get error() {
		return this.#error;
	}

	/**
	 * Create a successful result.
	 * @template T
	 * @param {T} [value]
	 * @returns {Result<T, any>}
	 */
	static success(value) {
		return new Result(true, null, value ?? null);
	}

	/**
	 * Create a successful result (alias for success).
	 * @template T
	 * @param {T} value
	 * @returns {Result<T, any>}
	 */
	static Ok(value) {
		return Result.success(value);
	}

	/**
	 * Create a failure result.
	 * @template E
	 * @param {E | string} error
	 * @returns {Result<any, E | AppError>}
	 */
	static failure(error) {
		const actualError = typeof error === "string" ? new AppError(error) : error;
		return new Result(false, /** @type {E | AppError} */ (actualError), null);
	}

	/**
	 * Create a failure result (alias for failure).
	 * @template E
	 * @param {E} error
	 * @returns {Result<any, E>}
	 */
	static Err(error) {
		return new Result(false, error, null);
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
	 * Get the value, throwing if this is an error.
	 * @returns {T}
	 */
	unwrap() {
		return this.value;
	}

	/**
	 * Get the value or a default if it's an error.
	 * @param {T} defaultValue
	 * @returns {T}
	 */
	unwrapOr(defaultValue) {
		return this.#isSuccess ? /** @type {T} */ (this.#value) : defaultValue;
	}

	/**
	 * Get the error, throwing if this is a success.
	 * @returns {E}
	 */
	unwrapErr() {
		if (this.#isSuccess) {
			throw new Error("Called unwrapErr on a success result.");
		}
		return /** @type {E} */ (this.#error);
	}

	/**
	 * Map the success value.
	 * @template U
	 * @param {function(T): U} fn
	 * @returns {Result<U, E>}
	 */
	map(fn) {
		if (this.#isSuccess) {
			return /** @type {Result<U, E>} */ (
				Result.success(fn(/** @type {T} */ (this.#value)))
			);
		}
		return /** @type {Result<U, E>} */ (/** @type {unknown} */ (this));
	}

	/**
	 * Map the error value.
	 * @template F
	 * @param {function(E): F} fn
	 * @returns {Result<T, F>}
	 */
	mapErr(fn) {
		if (!this.#isSuccess) {
			return /** @type {Result<T, F>} */ (
				Result.failure(fn(/** @type {E} */ (this.#error)))
			);
		}
		return /** @type {Result<T, F>} */ (/** @type {unknown} */ (this));
	}

	/**
	 * Chain operations that return Results.
	 * @template U
	 * @template F
	 * @param {function(T): Result<U, F>} fn
	 * @returns {Result<U, E | F>}
	 */
	andThen(fn) {
		if (this.#isSuccess) {
			return fn(/** @type {T} */ (this.#value));
		}
		return /** @type {Result<U, E | F>} */ (/** @type {unknown} */ (this));
	}

	/**
	 * Get value or compute from error.
	 * @param {function(E): T} fn
	 * @returns {T}
	 */
	unwrapOrElse(fn) {
		return this.#isSuccess
			? /** @type {T} */ (this.#value)
			: fn(/** @type {E} */ (this.#error));
	}

	/**
	 * Pattern match on the Result.
	 * @template R
	 * @param {Object} handlers
	 * @param {function(T): R} handlers.ok
	 * @param {function(E): R} handlers.err
	 * @returns {R}
	 */
	match(handlers) {
		return this.#isSuccess
			? handlers.ok(/** @type {T} */ (this.#value))
			: handlers.err(/** @type {E} */ (this.#error));
	}
}

/**
 * Wrap an async function to return a Result.
 * @template T
 * @param {function(): Promise<T>} fn
 * @returns {Promise<Result<T, any>>}
 */
export async function tryAsync(fn) {
	try {
		const value = await fn();
		return Result.success(value);
	} catch (error) {
		return Result.failure(error);
	}
}

/**
 * Wrap a sync function to return a Result.
 * @template T
 * @param {function(): T} fn
 * @returns {Result<T, any>}
 */
export function trySync(fn) {
	try {
		const value = fn();
		return Result.success(value);
	} catch (error) {
		return Result.failure(error);
	}
}
