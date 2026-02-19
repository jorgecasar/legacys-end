import { describe, expect, it } from "vitest";
import {
	AppError,
	DomainError,
	NotFoundError,
	Result,
	ValidationError,
} from "./errors.js";

describe("Errors", () => {
	it("should create AppError with default code", () => {
		const error = new AppError("Message");
		expect(error.message).toBe("Message");
		expect(error.code).toBe("INTERNAL_ERROR");
		expect(error.name).toBe("AppError");
	});

	it("should create DomainError with default code", () => {
		const error = new DomainError("Domain logic violated");
		expect(error.message).toBe("Domain logic violated");
		expect(error.code).toBe("DOMAIN_ERROR");
		expect(error.name).toBe("DomainError");
	});

	it("should create NotFoundError with default code", () => {
		const error = new NotFoundError("Resource missing");
		expect(error.message).toBe("Resource missing");
		expect(error.code).toBe("NOT_FOUND");
		expect(error.name).toBe("NotFoundError");
	});

	it("should create ValidationError with default code", () => {
		const error = new ValidationError("Invalid input");
		expect(error.message).toBe("Invalid input");
		expect(error.code).toBe("VALIDATION_ERROR");
		expect(error.name).toBe("ValidationError");
	});
});

describe("Result Pattern", () => {
	it("should create a successful result", () => {
		const result = Result.ok("success");
		expect(result.isOk()).toBe(true);
		expect(result.isErr()).toBe(false);
		expect(result.value).toBe("success");
	});

	it("should create an error result", () => {
		const error = new AppError("Fail");
		const result = Result.err(error);
		expect(result.isOk()).toBe(false);
		expect(result.isErr()).toBe(true);
		expect(result.error).toBe(error);
	});

	it("should throw when getting value from an error result", () => {
		const result = Result.err(new Error("Fail"));
		expect(() => result.value).toThrow("Cannot get value from an Error Result");
	});

	it("should throw when getting error from a success result", () => {
		const result = Result.ok("Success");
		expect(() => result.error).toThrow(
			"Cannot get error from a Success Result",
		);
	});

	it("should map success value", () => {
		const result = Result.ok(10);
		const mapped = result.map((n) => n * 2);
		expect(mapped.value).toBe(20);
	});

	it("should not map error result", () => {
		const result = Result.err("fail");
		const mapped = result.map((n) => n * 2);
		expect(mapped.isErr()).toBe(true);
		expect(mapped.error).toBe("fail");
	});

	it("should map error value", () => {
		const result = Result.err("fail");
		const mapped = result.mapErr((e) => e.toUpperCase());
		expect(mapped.error).toBe("FAIL");
	});

	it("should not mapErr on success result", () => {
		const result = Result.ok("success");
		const mapped = result.mapErr((e) => e.toUpperCase());
		expect(mapped.isOk()).toBe(true);
		expect(mapped.value).toBe("success");
	});
});
