/**
 * Result Type - Represents the outcome of an operation that may fail
 *
 * This pattern makes error handling explicit and composable.
 * Instead of throwing exceptions or returning null, operations return
 * a Result that can be either Ok (success) or Err (failure).
 *
 * @template T - The type of the success value
 * @template E - The type of the error
 */

/**
 * @typedef {Object} ResultOk
 * @template T
 * @property {true} ok - Indicates success
 * @property {T} value - The success value
 * @property {null} error - No error (always null)
 */

/**
 * @typedef {Object} ResultErr
 * @template E
 * @property {false} ok - Indicates failure
 * @property {null} value - No value (always null)
 * @property {E} error - The error
 */

/**
 * @template T, E
 * @typedef {ResultOk<T> | ResultErr<E>} Result
 */

export class Result {
	/**
	 * @private
	 * @param {any} value
	 * @param {any} error
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
	 * @returns {Result<T, never>}
	 */
	static Ok(value) {
		return new Result(value, null);
	}

	/**
	 * Create a failed Result
	 * @template E
	 * @param {E} error - The error
	 * @returns {Result<never, E>}
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
	 * Get the value, throwing if it's an error
	 * @returns {T}
	 * @throws {E} If the result is an error
	 */
	unwrap() {
		if (this.isErr()) {
			throw this._error;
		}
		return this._value;
	}

	/**
	 * Get the value or a default if it's an error
	 * @template T
	 * @param {T} defaultValue - The default value to return on error
	 * @returns {T}
	 */
	unwrapOr(defaultValue) {
		return this.isOk() ? this._value : defaultValue;
	}

	/**
	 * Get the error, throwing if it's successful
	 * @returns {E}
	 * @throws {Error} If the result is Ok
	 */
	unwrapErr() {
		if (this.isOk()) {
			throw new Error("Called unwrapErr on an Ok value");
		}
		return this._error;
	}

	/**
	 * Map the success value to a new value
	 * @template U
	 * @param {(value: T) => U} fn - The mapping function
	 * @returns {Result<U, E>}
	 */
	map(fn) {
		if (this.isErr()) {
			return this;
		}
		return Result.Ok(fn(this._value));
	}

	/**
	 * Map the error to a new error
	 * @template F
	 * @param {(error: E) => F} fn - The mapping function
	 * @returns {Result<T, F>}
	 */
	mapErr(fn) {
		if (this.isOk()) {
			return this;
		}
		return Result.Err(fn(this._error));
	}

	/**
	 * Chain operations that return Results
	 * @template U
	 * @param {(value: T) => Result<U, E>} fn - The function to chain
	 * @returns {Result<U, E>}
	 */
	andThen(fn) {
		if (this.isErr()) {
			return this;
		}
		return fn(this._value);
	}

	/**
	 * Get the value or compute it from the error
	 * @template T
	 * @param {(error: E) => T} fn - Function to compute value from error
	 * @returns {T}
	 */
	unwrapOrElse(fn) {
		return this.isOk() ? this._value : fn(this._error);
	}

	/**
	 * Match on the result, providing handlers for both cases
	 * @template U
	 * @param {Object} handlers
	 * @param {(value: T) => U} handlers.ok - Handler for success
	 * @param {(error: E) => U} handlers.err - Handler for error
	 * @returns {U}
	 */
	match({ ok, err }) {
		return this.isOk() ? ok(this._value) : err(this._error);
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
 * Wrap an async function to return a Result instead of throwing
 * @template T, E
 * @param {() => Promise<T>} fn - The async function to wrap
 * @returns {Promise<Result<T, E>>}
 */
export async function tryAsync(fn) {
	try {
		const value = await fn();
		return Result.Ok(value);
	} catch (error) {
		return Result.Err(error);
	}
}

/**
 * Wrap a sync function to return a Result instead of throwing
 * @template T, E
 * @param {() => T} fn - The function to wrap
 * @returns {Result<T, E>}
 */
export function trySync(fn) {
	try {
		const value = fn();
		return Result.Ok(value);
	} catch (error) {
		return Result.Err(error);
	}
}
