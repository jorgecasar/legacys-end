// src/utils/result.js

/**
 * Represents a successful operation.
 * @template T
 */
export class Success {
  /**
   * @param {T} value The successful result value.
   */
  constructor(value) {
    this.value = value;
    this.isSuccess = true;
    this.isFailure = false;
  }

  /**
   * Maps a function over the success value.
   * @template U
   * @param {(value: T) => U | Success<U> | Failure<any>} fn
   * @returns {Success<U> | Failure<any>}
   */
  map(fn) {
    try {
      const result = fn(this.value);
      if (result instanceof Success || result instanceof Failure) {
        return result;
      }
      return new Success(result);
    } catch (error) {
      return new Failure(error);
    }
  }

  /**
   * Maps a function over the success value, allowing it to return a Promise.
   * @template U
   * @param {(value: T) => Promise<U> | Promise<Success<U>> | Promise<Failure<any>>} fn
   * @returns {Promise<Success<U> | Failure<any>>}
   */
  async mapAsync(fn) {
    try {
      const result = await fn(this.value);
      if (result instanceof Success || result instanceof Failure) {
        return result;
      }
      return new Success(result);
    } catch (error) {
      return new Failure(error);
    }
  }

  /**
   * Performs a side effect.
   * @param {(value: T) => void} fn
   * @returns {this}
   */
  tap(fn) {
    fn(this.value);
    return this;
  }

  /**
   * Folds the result into a single value.
   * @template U
   * @param {(failure: any) => U} on_failure - Function to apply if the result is a failure.
   * @param {(value: T) => U} on_success - Function to apply if the result is a success.
   * @returns {U}
   */
  fold(on_failure, on_success) {
    return on_success(this.value);
  }
}

/**
 * Represents a failed operation.
 * @template E
 */
export class Failure {
  /**
   * @param {E} error The failure error.
   */
  constructor(error) {
    this.error = error;
    this.isSuccess = false;
    this.isFailure = true;
  }

  /**
   * Maps a function over the success value. Does nothing if it's a failure.
   * @template U
   * @param {(value: any) => U | Success<U> | Failure<any>} fn
   * @returns {Success<any> | Failure<any>}
   */
  map(fn) {
    return this; // If it's a failure, do nothing.
  }

  /**
   * Maps a function over the success value. Does nothing if it's a failure.
   * @template U
   * @param {(value: any) => Promise<U> | Promise<Success<U>> | Promise<Failure<any>>} fn
   * @returns {Promise<Success<any> | Failure<any>>}
   */
  async mapAsync(fn) {
    return this; // If it's a failure, do nothing.
  }

  /**
   * Performs a side effect. Does nothing if it's a failure.
   * @param {(error: E) => void} fn
   * @returns {this}
   */
  tap(fn) {
    return this; // If it's a failure, do nothing.
  }

  /**
   * Folds the result into a single value.
   * @template U
   * @param {(failure: E) => U} on_failure - Function to apply if the result is a failure.
   * @param {(value: any) => U} on_success - Function to apply if the result is a success.
   * @returns {U}
   */
  fold(on_failure, on_success) {
    return on_failure(this.error);
  }

  /**
   * Gets the error, throwing it if it's not a failure.
   * @returns {E}
   */
  get() {
    return this.error;
  }
}
