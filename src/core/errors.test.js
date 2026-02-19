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
			expect(result.isSuccess).toBe(true);
			expect(result.isFailure).toBe(false);
			expect(result.value).toBe("success");
			expect(result.error).toBeNull();
		});

		it("should create a success result without a value", () => {
			const result = Result.ok();
			expect(result.isSuccess).toBe(true);
			expect(result.isFailure).toBe(false);
			expect(result.value).toBeUndefined();
			expect(result.error).toBeNull();
		});

		it("should create a failure result with an error", () => {
			const error = new AppError("Something went wrong");
			const result = Result.error(error);
			expect(result.isSuccess).toBe(false);
			expect(result.isFailure).toBe(true);
			expect(result.error).toBe(error);
			expect(result.value).toBeNull();
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
			expect(() => (result.isSuccess = false)).toThrow();
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
