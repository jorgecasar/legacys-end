import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubCommand } from "./return-to-hub-command.js";

describe("ReturnToHubCommand", () => {
	/** @type {any} */
	let mockSessionManager;
	/** @type {ReturnToHubCommand} */
	let command;

	beforeEach(() => {
		mockSessionManager = {
			returnToHub: vi.fn().mockResolvedValue({ success: true }),
		};

		command = new ReturnToHubCommand({
			sessionManager: mockSessionManager,
		});
	});

	it("should have correct name", () => {
		expect(command.name).toBe("ReturnToHub");
	});

	it("should execute session manager", async () => {
		const result = await command.execute();

		expect(mockSessionManager.returnToHub).toHaveBeenCalled();
		expect(result).toEqual({ success: true });
	});

	it("should throw error if session manager fails", async () => {
		const error = new Error("Navigation failed");
		mockSessionManager.returnToHub.mockResolvedValue({ success: false, error });

		await expect(command.execute()).rejects.toThrow("Navigation failed");
	});

	it("should throw generic error if session manager fails without error object", async () => {
		mockSessionManager.returnToHub.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to return to hub");
	});
});
