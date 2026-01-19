import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContinueQuestUseCase } from "./continue-quest.js";

describe("ContinueQuestUseCase", () => {
	/** @type {ContinueQuestUseCase} */
	let useCase;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockQuest;
	/** @type {any} */
	let mockLogger;

	beforeEach(() => {
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapters: [],
		};

		mockQuestController = {
			continueQuest: vi.fn().mockResolvedValue(undefined),
			currentQuest: mockQuest,
		};

		mockLogger = {
			error: vi.fn(),
		};

		useCase = new ContinueQuestUseCase({
			questController: mockQuestController,
			logger: /** @type {any} */ (mockLogger),
		});
	});

	it("should continue quest successfully", async () => {
		const result = await useCase.execute("test-quest");

		expect(result.success).toBe(true);
		expect(result.quest).toBe(mockQuest);
		expect(result.error).toBeUndefined();
		expect(mockQuestController.continueQuest).toHaveBeenCalledWith(
			"test-quest",
		);
	});

	it("should handle errors gracefully", async () => {
		const error = new Error("Quest not found");
		mockQuestController.continueQuest.mockRejectedValue(error);

		const result = await useCase.execute("invalid-quest");

		expect(result.success).toBe(false);
		expect(result.quest).toBeNull();
		expect(result.error).toBe(error);
	});
});
