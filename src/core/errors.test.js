import { describe, expect, it } from "vitest";
import {
	AppError,
	DomainError,
	NetworkError,
	Result,
	ValidationError,
} from "./errors.js";

describe("core/errors", () => {
	describe("Result", () => {
		it("should create a success result with a value", () => {
			const result = Result.ok("success");
			expect(result.isOk()).toBe(true);
			expect(result.isSuccess).toBe(true);
			expect(result.isFailure).toBe(false);
			expect(result.value).toBe("success");
			expect(() => result.error).toThrow(
				"Cannot get error from a Success Result",
			);
		});

		it("should create a success result without a value", () => {
			const result = Result.ok();
			expect(result.isOk()).toBe(true);
			expect(result.value).toBeNull();
		});

		it("should create a failure result with an error", () => {
			const error = new AppError("Something went wrong");
			const result = Result.err(error);
			expect(result.isErr()).toBe(true);
			expect(result.isSuccess).toBe(false);
			expect(result.isFailure).toBe(true);
			expect(result.error).toBe(error);
			expect(() => result.value).toThrow(
				"Cannot get value from an Error Result",
			);
		});

		it("should throw an error if creating a successful result with an error", () => {
			expect(() => new Result(true, new AppError("error"), "value")).toThrow(
				"InvalidOperation: A result cannot be successful and contain an error.",
			);
		});

		it("should throw an error if creating a failed result without an error", () => {
			expect(() => new Result(false, null, null)).toThrow(
				"InvalidOperation: A failing result needs to contain an error.",
			);
		});

		it("should be immutable", () => {
			const result = Result.ok("test");
			expect(() => {
				// @ts-expect-error
				result.newProp = true;
			}).toThrow();
		});

		it("should map success value", () => {
			const result = Result.ok(10);
			const mapped = result.map((n) => n * 2);
			expect(mapped.value).toBe(20);
		});

		it("should map error value", () => {
			const result = Result.err("fail");
			const mapped = result.mapErr((e) => e.toUpperCase());
			expect(mapped.error).toBe("FAIL");
		});
	});

	describe("Custom Errors", () => {
		it("AppError should have the correct name", () => {
			const error = new AppError("App error");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error.name).toBe("AppError");
			expect(error.message).toBe("App error");
		});

		it("ValidationError should have the correct name and inherit from AppError", () => {
			const error = new ValidationError("Validation error");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error).toBeInstanceOf(ValidationError);
			expect(error.name).toBe("ValidationError");
			expect(error.message).toBe("Validation error");
		});

		it("NetworkError should have the correct name and inherit from AppError", () => {
			const error = new NetworkError("Network error");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error).toBeInstanceOf(NetworkError);
			expect(error.name).toBe("NetworkError");
			expect(error.message).toBe("Network error");
		});

		it("DomainError should have the correct name and properties", () => {
			const error = new DomainError("Domain error", "TEST_CODE");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error).toBeInstanceOf(DomainError);
			expect(error.name).toBe("DomainError");
			expect(error.message).toBe("Domain error");
			expect(error.code).toBe("TEST_CODE");
		});
	});
});
