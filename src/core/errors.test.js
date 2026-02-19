import { describe, expect, it } from "vitest";
import { AppError, Result, tryAsync, trySync } from "./errors.js";

describe("Result", () => {
	it("should create a success result", () => {
		const result = Result.success(42);
		expect(result.isSuccess).toBe(true);
		expect(result.isFailure).toBe(false);
		expect(result.value).toBe(42);
		expect(result.error).toBeUndefined();
	});

	it("should create a failure result with AppError", () => {
		const error = new AppError("Something went wrong", "ERR_CODE");
		const result = Result.failure(error);
		expect(result.isSuccess).toBe(false);
		expect(result.isFailure).toBe(true);
		expect(result.error).toBe(error);
		expect(result.value).toBeUndefined();
	});

	it("should create a failure result from string", () => {
		const result = Result.failure("Error string");
		expect(result.isFailure).toBe(true);
		expect(result.error).toBeInstanceOf(AppError);
		expect(/** @type {AppError} */ (result.error).message).toBe("Error string");
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
