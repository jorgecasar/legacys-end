import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubCommand } from "./return-to-hub-command.js";

describe("ReturnToHubCommand", () => {
	/** @type {any} */
	let mockUseCase;
	/** @type {ReturnToHubCommand} */
	let command;

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue({ success: true }),
		};

		command = new ReturnToHubCommand({
			returnToHubUseCase: mockUseCase,
		});
	});

	it("should have correct name", () => {
		expect(command.name).toBe("ReturnToHub");
	});

	it("should execute use case", async () => {
		const result = await command.execute();

		expect(mockUseCase.execute).toHaveBeenCalled();
		expect(result).toEqual({ success: true });
	});

	it("should throw error if use case fails", async () => {
		const error = new Error("Navigation failed");
		mockUseCase.execute.mockResolvedValue({ success: false, error });

		await expect(command.execute()).rejects.toThrow("Navigation failed");
	});

	it("should throw generic error if use case fails without error object", async () => {
		mockUseCase.execute.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to return to hub");
	});
});
