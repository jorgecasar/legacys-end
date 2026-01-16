import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubCommand } from "./return-to-hub-command.js";

describe("ReturnToHubCommand", () => {
	/** @type {any} */
	let mockQuestLoader;
	/** @type {ReturnToHubCommand} */
	let command;

	beforeEach(() => {
		mockQuestLoader = {
			returnToHub: vi.fn().mockResolvedValue({ success: true }),
		};

		command = new ReturnToHubCommand({
			questLoader: mockQuestLoader,
		});
	});

	it("should have correct name", () => {
		expect(command.name).toBe("ReturnToHub");
	});

	it("should execute quest loader", async () => {
		const result = await command.execute();

		expect(mockQuestLoader.returnToHub).toHaveBeenCalled();
		expect(result).toEqual({ success: true });
	});

	it("should throw error if quest loader fails", async () => {
		const error = new Error("Navigation failed");
		mockQuestLoader.returnToHub.mockResolvedValue({ success: false, error });

		await expect(command.execute()).rejects.toThrow("Navigation failed");
	});

	it("should throw generic error if quest loader fails without error object", async () => {
		mockQuestLoader.returnToHub.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to return to hub");
	});
});
