import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContinueQuestCommand } from "./continue-quest-command.js";

describe("ContinueQuestCommand", () => {
	/** @type {any} */
	let mockQuestLoader;
	const questId = "quest-1";
	/** @type {ContinueQuestCommand} */
	let command;

	beforeEach(() => {
		mockQuestLoader = {
			continueQuest: vi
				.fn()
				.mockResolvedValue({ success: true, quest: { id: questId } }),
		};

		command = new ContinueQuestCommand({
			questLoader: mockQuestLoader,
			questId,
		});
	});

	it("should have correct name and metadata", () => {
		expect(command.name).toBe("ContinueQuest");
		expect(command.metadata).toEqual({ questId });
	});

	it("should execute quest loader with correct questId", async () => {
		const result = await command.execute();

		expect(mockQuestLoader.continueQuest).toHaveBeenCalledWith(questId);
		expect(result).toEqual({ success: true, quest: { id: questId } });
	});

	it("should throw error if quest loader fails", async () => {
		const error = new Error("Quest failed");
		mockQuestLoader.continueQuest.mockResolvedValue({
			success: false,
			error,
		});

		await expect(command.execute()).rejects.toThrow("Quest failed");
	});

	it("should throw generic error if quest loader fails without error object", async () => {
		mockQuestLoader.continueQuest.mockResolvedValue({ success: false });

		await expect(command.execute()).rejects.toThrow("Failed to continue quest");
	});
});
