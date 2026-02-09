import { describe, expect, it } from "vitest";
import { AppError } from "../core/errors.js";
import { Result, tryAsync, trySync } from "./result.js";

describe("Result", () => {
	it("should create a success result", () => {
		const result = Result.success(42);
		expect(result.isSuccess).toBe(true);
		expect(result.isFailure).toBe(false);
		expect(result.value).toBe(42);
		expect(result.ok).toBe(true);
	});

	it("should create a failure result with AppError", () => {
		const error = new AppError("Something went wrong", "ERR_CODE");
		const result = Result.failure(error);
		expect(result.isSuccess).toBe(false);
		expect(result.isFailure).toBe(true);
		expect(result.error).toBe(error);
		expect(() => result.value).toThrow();
	});

	it("should create a failure result from string", () => {
		const result = Result.failure("Error string");
		expect(result.isFailure).toBe(true);
		expect(result.error).toBeInstanceOf(AppError);
		expect(/** @type {AppError} */ (result.error).message).toBe("Error string");
	});

	it("should support Ok and Err aliases for compatibility", () => {
		const ok = Result.Ok(1);
		const err = Result.Err("error");
		expect(ok.isSuccess).toBe(true);
		expect(err.isFailure).toBe(true);
	});

	it("should map success value", () => {
		const result = Result.success(10).map((n) => n * 2);
		expect(result.value).toBe(20);
	});

	it("should not map error value", () => {
		const result = Result.failure("error").map((n) => n * 2);
		expect(result.isFailure).toBe(true);
	});

	it("should chain results with andThen", () => {
		const result = Result.success(5).andThen((n) => Result.success(n + 5));
		expect(result.value).toBe(10);
	});

	it("should support match", () => {
		const result = Result.success(1);
		const value = result.match({
			ok: (n) => n + 1,
			err: () => 0,
		});
		expect(value).toBe(2);
	});

	it("should unwrap values", () => {
		expect(Result.success(1).unwrap()).toBe(1);
		expect(Result.failure("err").unwrapOr(5)).toBe(5);
	});
});

describe("trySync", () => {
	it("should return success for successful functions", () => {
		const result = trySync(() => 42);
		expect(result.isSuccess).toBe(true);
		expect(result.value).toBe(42);
	});

	it("should return failure for throwing functions", () => {
		const result = trySync(() => {
			throw new Error("fail");
		});
		expect(result.isFailure).toBe(true);
	});
});

describe("tryAsync", () => {
	it("should return success for successful async functions", async () => {
		const result = await tryAsync(async () => 42);
		expect(result.isSuccess).toBe(true);
		expect(result.value).toBe(42);
	});

	it("should return failure for failing async functions", async () => {
		const result = await tryAsync(async () => {
			throw new Error("fail");
		});
		expect(result.isFailure).toBe(true);
	});
});
