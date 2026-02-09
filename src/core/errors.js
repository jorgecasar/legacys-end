// src/core/errors.js

/**
 * Base class for application-specific errors.
 * Extends the built-in Error class for standard error handling.
 */
export class AppError extends Error {
  /**
   * Creates an instance of AppError.
   * @param {string} message - The error message.
   * @param {object} [options] - Additional error options.
   * @param {string} [options.cause] - The cause of the error.
   * @param {boolean} [options.isUserError=false] - Flag to indicate if the error is user-facing.
   */
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.isUserError = options.isUserError || false;

    // Maintains proper stack trace in Node.js environment.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
