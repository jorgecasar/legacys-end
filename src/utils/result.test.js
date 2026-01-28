import { describe, expect, it } from "vitest";
import { Result, tryAsync, trySync } from "./result.js";

/** @typedef {import('./result.js').Result<any, any>} AnyResult */
/** @typedef {import('./result.js').Result<number, Error>} NumberResult */

describe("Result", () => {
	describe("Ok", () => {
		it("should create a successful result", () => {
			const result = Result.Ok(42);
			expect(result.isOk()).toBe(true);
			expect(result.isErr()).toBe(false);
			expect(result.value).toBe(42);
			expect(result.error).toBe(null);
		});

		it("should unwrap to the value", () => {
			const result = Result.Ok(42);
			expect(result.unwrap()).toBe(42);
		});

		it("should return value with unwrapOr", () => {
			const result = Result.Ok(42);
			expect(result.unwrapOr(0)).toBe(42);
		});
	});

	describe("Err", () => {
		it("should create a failed result", () => {
			const error = new Error("Failed");
			const result = Result.Err(error);
			expect(result.isOk()).toBe(false);
			expect(result.isErr()).toBe(true);
			expect(result.value).toBe(null);
			expect(result.error).toBe(error);
		});

		it("should throw when unwrapping", () => {
			const error = new Error("Failed");
			const result = Result.Err(error);
			expect(() => result.unwrap()).toThrow(error);
		});

		it("should return default with unwrapOr", () => {
			const result = /** @type {Result<number, Error>} */ (
				/** @type {unknown} */ (Result.Err(new Error("Failed")))
			);
			expect(result.unwrapOr(0)).toBe(0);
		});

		it("should unwrap error", () => {
			const error = new Error("Failed");
			const result = Result.Err(error);
			expect(result.unwrapErr()).toBe(error);
		});
	});

	describe("map", () => {
		it("should map Ok value", () => {
			const result = Result.Ok(42).map((x) => x * 2);
			expect(result.unwrap()).toBe(84);
		});

		it("should not map Err value", () => {
			const error = new Error("Failed");
			const result = /** @type {Result<number, Error>} */ (
				/** @type {unknown} */ (Result.Err(error))
			);
			const mapped = result.map((x) => x * 2);
			expect(mapped.error).toBe(error);
		});
	});

	describe("mapErr", () => {
		it("should not map Ok error", () => {
			const result = Result.Ok(42).mapErr((_e) => new Error("Mapped"));
			expect(result.value).toBe(42);
		});

		it("should map Err error", () => {
			const result = Result.Err(new Error("Original")).mapErr(
				(_e) => new Error("Mapped"),
			);
			expect(/** @type {Error} */ (result.error).message).toBe("Mapped");
		});
	});

	describe("andThen", () => {
		it("should chain Ok results", () => {
			const result = Result.Ok(42).andThen(
				/** @param {number} x */ (x) => Result.Ok(x * 2),
			);
			expect(result.unwrap()).toBe(84);
		});

		it("should short-circuit on Err", () => {
			const error = new Error("Failed");
			const original = /** @type {Result<number, Error>} */ (
				/** @type {unknown} */ (Result.Err(error))
			);
			const result = original.andThen(
				/** @param {number} x */ (x) => Result.Ok(x * 2),
			);
			expect(/** @type {Error} */ (result.error)).toBe(error);
		});

		it("should propagate Err from chained operation", () => {
			const result = Result.Ok(42).andThen(
				/** @param {number} _x */ (_x) => Result.Err(new Error("Chain failed")),
			);
			expect(result.isErr()).toBe(true);
			expect(/** @type {Error} */ (result.error).message).toBe("Chain failed");
		});
	});

	describe("unwrapOrElse", () => {
		it("should return value for Ok", () => {
			const result = Result.Ok(42);
			expect(result.unwrapOrElse((_e) => 0)).toBe(42);
		});

		it("should compute value from error for Err", () => {
			const result = /** @type {Result<number, Error>} */ (
				/** @type {unknown} */ (Result.Err(new Error("Failed")))
			);
			expect(result.unwrapOrElse((e) => e.message.length)).toBe(6);
		});
	});

	describe("match", () => {
		it("should call ok handler for Ok", () => {
			const result = Result.Ok(42);
			const value = result.match({
				ok: (x) => x * 2,
				err: (_e) => 0,
			});
			expect(value).toBe(84);
		});

		it("should call err handler for Err", () => {
			const result = /** @type {Result<number, Error>} */ (
				/** @type {unknown} */ (Result.Err(new Error("Failed")))
			);
			const value = result.match({
				ok: (x) => x * 2,
				// @ts-expect-error
				err: (e) => e.message,
			});
			expect(value).toBe("Failed");
		});
	});

	describe("trySync", () => {
		it("should return Ok for successful function", () => {
			const result = trySync(() => 42);
			expect(result.isOk()).toBe(true);
			expect(result.value).toBe(42);
		});

		it("should return Err for throwing function", () => {
			const result = trySync(() => {
				throw new Error("Failed");
			});
			expect(result.isErr()).toBe(true);
			expect(/** @type {Error} */ (result.error).message).toBe("Failed");
		});
	});

	describe("tryAsync", () => {
		it("should return Ok for successful async function", async () => {
			const result = await tryAsync(async () => 42);
			expect(result.isOk()).toBe(true);
			expect(result.value).toBe(42);
		});

		it("should return Err for rejecting async function", async () => {
			const result = await tryAsync(async () => {
				throw new Error("Failed");
			});
			expect(result.isErr()).toBe(true);
			expect(/** @type {Error} */ (result.error).message).toBe("Failed");
		});
	});
});
