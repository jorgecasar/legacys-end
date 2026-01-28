/**
 * Result Type - Represents the outcome of an operation that may fail
 *
 * This pattern makes error handling explicit and composable.
 * Instead of throwing exceptions or returning null, operations return
 * a Result that can be either Ok (success) or Err (failure).
 * Result Type - Explicit Error Handling
 *
 * Represents the result of an operation that can either succeed or fail.
 * Inspired by Rust's Result<T, E> type.
 *
 * Usage:
 * ```js
 * const result = Result.Ok(42);
 * const error = Result.Err(new Error("Failed"));
 * ```
 */

/**
 * Result class for explicit error handling
 * Can be either Ok (success) or Err (failure)
 * @template T
 * @template E
 */
export class Result {
	/**
	 * @private
	 * @param {T | null} value
	 * @param {E | null} error
	 */
	constructor(value, error) {
		this._value = value;
		this._error = error;
		this.ok = error === null;
	}

	/**
	 * Create a successful Result
	 * @template T
	 * @param {T} value - The success value
	 * @returns {Result<T, null>}
	 */
	static Ok(value) {
		return new Result(value, null);
	}

	/**
	 * Create a failed Result
	 * @template E
	 * @param {E} error - The error
	 * @returns {Result<null, E>}
	 */
	static Err(error) {
		return new Result(null, error);
	}

	/**
	 * Check if the result is successful
	 * @returns {boolean}
	 */
	isOk() {
		return this.ok;
	}

	/**
	 * Check if the result is an error
	 * @returns {boolean}
	 */
	isErr() {
		return !this.ok;
	}

	/**
	 * Get the value, throwing if this is an error
	 * @returns {T}
	 * @throws {Error} If this is an Err
	 */
	unwrap() {
		if (this.isErr()) {
			throw this.error;
		}
		return /** @type {T} */ (this._value);
	}

	/**
	 * Get the value or a default if it's an error
	 * @param {T} defaultValue - The default value to return on error
	 * @returns {T}
	 */
	unwrapOr(defaultValue) {
		return this.isOk() ? /** @type {T} */ (this._value) : defaultValue;
	}

	/**
	 * Get the error, throwing if this is a success
	 * @returns {E}
	 * @throws {Error} If this is an Ok
	 */
	unwrapErr() {
		if (this.isOk()) {
			throw new Error("Called unwrapErr on an Ok value");
		}
		return /** @type {E} */ (this._error);
	}

	/**
	 * Map the success value
	 * @template U
	 * @param {function(T): U} fn - The mapping function
	 * @returns {Result<U, E>}
	 */
	map(fn) {
		if (this.isOk()) {
			// @ts-expect-error - We know value is T
			return Result.Ok(fn(this._value));
		}
		// @ts-expect-error - We know error is E
		return Result.Err(this._error);
	}

	/**
	 * Map the error value
	 * @template F
	 * @param {function(E): F} fn - The mapping function
	 * @returns {Result<T, F>}
	 */
	mapErr(fn) {
		if (this.isErr()) {
			// @ts-expect-error - We know error is E
			return Result.Err(fn(this._error));
		}
		// @ts-expect-error - We know value is T
		return Result.Ok(this._value);
	}

	/**
	 * Chain operations that return Results
	 * @template U
	 * @template F
	 * @param {function(T): Result<U, F>} fn - The function to chain
	 * @returns {Result<U, E | F>}
	 */
	andThen(fn) {
		if (this.isOk()) {
			// @ts-expect-error - We know value is T
			return fn(this._value);
		}
		// @ts-expect-error - We know error is E
		return Result.Err(this._error);
	}

	/**
	 * Get value or compute from error
	 * @param {function(E): T} fn - Function to compute value from error
	 * @returns {T}
	 */
	unwrapOrElse(fn) {
		// @ts-expect-error - We know types match logic
		return this.isOk() ? this._value : fn(this._error);
	}

	/**
	 * Pattern match on the Result
	 * @template R
	 * @param {Object} handlers
	 * @param {function(T): R} handlers.ok - Handler for success
	 * @param {function(E): R} handlers.err - Handler for error
	 * @returns {R}
	 */
	match(handlers) {
		// @ts-expect-error - types match logic
		return this.isOk() ? handlers.ok(this._value) : handlers.err(this._error);
	}

	/**
	 * Get the value property (for compatibility)
	 * @returns {T | null}
	 */
	get value() {
		return this._value;
	}

	/**
	 * Get the error property (for compatibility)
	 * @returns {E | null}
	 */
	get error() {
		return this._error;
	}
}

/**
 * Wrap an async function to return a Result
 * @template T
 * @param {function(): Promise<T>} fn - Async function to wrap
 * @returns {Promise<Result<T, unknown>>}
 */
export async function tryAsync(fn) {
	try {
		const value = await fn();
		return Result.Ok(value);
	} catch (error) {
		return /** @type {Result<T, unknown>} */ (Result.Err(error));
	}
}

/**
 * Wrap a sync function to return a Result
 * @template T
 * @param {function(): T} fn - Function to wrap
 * @returns {Result<T, unknown>}
 */
export function trySync(fn) {
	try {
		const value = fn();
		return Result.Ok(value);
	} catch (error) {
		return /** @type {Result<T, unknown>} */ (Result.Err(error));
	}
}
