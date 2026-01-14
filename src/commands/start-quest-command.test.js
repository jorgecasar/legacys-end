import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartQuestCommand } from "./start-quest-command.js";

describe("StartQuestCommand", () => {
	/** @type {any} */
	let mockSessionManager;
	const questId = "quest-1";
	/** @type {StartQuestCommand} */
	let command;

	beforeEach(() => {
		mockSessionManager = {
			startQuest: vi
				.fn()
				.mockResolvedValue({ success: true, quest: { id: questId } }),
		};

		command = new StartQuestCommand({
			sessionManager: mockSessionManager,
			questId,
		});
	});

	it("should have correct name and metadata", () => {
		expect(command.name).toBe("StartQuest");
		expect(command.metadata).toEqual({ questId });
	});

	it("should execute session manager with correct questId", async () => {
		const result = await command.execute();

		expect(mockSessionManager.startQuest).toHaveBeenCalledWith(questId);
		expect(result).toEqual({ success: true, quest: { id: questId } });
	});

	it("should throw error if session manager fails", async () => {
		const error = new Error("Quest failed");
		mockSessionManager.startQuest.mockResolvedValue({ success: false, error });

		await expect(command.execute()).rejects.toThrow("Quest failed");
	});

	it("should throw generic error if session manager fails without error object", async () => {
		mockSessionManager.startQuest.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to start quest");
	});
});
