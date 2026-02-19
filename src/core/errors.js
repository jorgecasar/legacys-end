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
 * Result pattern implementation for consistent error handling.
 *
 * @template TValue
 * @template TError
 */
export class Result {
	/** @type {TValue | undefined} */
	value;
	/** @type {TError | undefined} */
	error;
	/** @type {boolean} */
	isSuccess;

	/**
	 * @private
	 * @param {boolean} isSuccess
	 * @param {TError | undefined} error
	 * @param {TValue | undefined} value
	 */
	constructor(isSuccess, error, value) {
		this.isSuccess = isSuccess;
		this.error = error;
		this.value = value;
		Object.freeze(this);
	}

	get isFailure() {
		return !this.isSuccess;
	}

	/**
	 * Create a successful result.
	 * @template TValue
	 * @param {TValue} [value]
	 * @returns {Result<TValue, any>}
	 */
	static success(value) {
		return new Result(true, undefined, value);
	}

	/**
	 * Create a failure result.
	 * @template TError
	 * @param {TError | string} error
	 * @returns {Result<any, TError | AppError>}
	 */
	static failure(error) {
		const actualError = typeof error === "string" ? new AppError(error) : error;
		return new Result(false, actualError, undefined);
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

/**
 * For unauthorized access.
 */
export class UnauthorizedError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "UNAUTHORIZED");
	}
}

/**
 * For forbidden actions.
 */
export class ForbiddenError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "FORBIDDEN");
	}
}

/**
 * For invalid input.
 */
export class InvalidInputError extends AppError {
	/**
	 * @param {string} message
	 * @param {string} [code]
	 */
	constructor(message, code) {
		super(message, code || "INVALID_INPUT");
	}
}
