/**
 * @template T
 */
export class Result {
	/**
	 * @param {boolean} isSuccess
	 * @param {string} [error]
	 * @param {T} [value]
	 */
	constructor(isSuccess, error, value) {
		if (isSuccess && error) {
			throw new Error("Successful result must not have an error.");
		}
		if (!isSuccess && !error) {
			throw new Error("Failed result must have an error message.");
		}

		this.isSuccess = isSuccess;
		this.isFailure = !isSuccess;
		this.error = error;
		/** @type {T|undefined} */
		this._value = value;
	}

	/**
	 * @returns {T}
	 */
	getValue() {
		if (!this.isSuccess) {
			throw new Error("Cannot get the value of a failed result.");
		}
		return /** @type {T} */ (this._value);
	}

	/**
	 * @template U
	 * @param {U} [value]
	 * @returns {Result<U>}
	 */
	static success(value) {
		return new Result(true, undefined, value);
	}

	/**
	 * @param {string} error
	 * @returns {Result<never>}
	 */
	static failure(error) {
		return new Result(false, error);
	}
}
