import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContinueQuestCommand } from "./continue-quest-command.js";

describe("ContinueQuestCommand", () => {
	/** @type {any} */
	let mockSessionManager;
	const questId = "quest-1";
	/** @type {ContinueQuestCommand} */
	let command;

	beforeEach(() => {
		mockSessionManager = {
			continueQuest: vi
				.fn()
				.mockResolvedValue({ success: true, quest: { id: questId } }),
		};

		command = new ContinueQuestCommand({
			sessionManager: mockSessionManager,
			questId,
		});
	});

	it("should have correct name and metadata", () => {
		expect(command.name).toBe("ContinueQuest");
		expect(command.metadata).toEqual({ questId });
	});

	it("should execute session manager with correct questId", async () => {
		const result = await command.execute();

		expect(mockSessionManager.continueQuest).toHaveBeenCalledWith(questId);
		expect(result).toEqual({ success: true, quest: { id: questId } });
	});

	it("should throw error if session manager fails", async () => {
		const error = new Error("Quest failed");
		mockSessionManager.continueQuest.mockResolvedValue({
			success: false,
			error,
		});

		await expect(command.execute()).rejects.toThrow("Quest failed");
	});

	it("should throw generic error if session manager fails without error object", async () => {
		mockSessionManager.continueQuest.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to continue quest");
	});
});
