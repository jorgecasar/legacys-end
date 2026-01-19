import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartQuestUseCase } from "./start-quest.js";

describe("StartQuestUseCase", () => {
	/** @type {StartQuestUseCase} */
	let useCase;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockQuest;

	beforeEach(() => {
		// Create mock quest
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapters: [],
		};

		// Create mock quest controller
		mockQuestController = {
			startQuest: vi.fn().mockResolvedValue(undefined),
			currentQuest: mockQuest,
		};

		// Create use case instance
		useCase = new StartQuestUseCase({
			questController: mockQuestController,
			logger: /** @type {any} */ ({ error: vi.fn() }),
		});
	});

	it("should start quest successfully", async () => {
		const result = await useCase.execute("test-quest");

		expect(result.success).toBe(true);
		expect(result.quest).toBe(mockQuest);
		expect(result.error).toBeUndefined();
		expect(mockQuestController.startQuest).toHaveBeenCalledWith("test-quest");
	});

	it("should handle errors gracefully", async () => {
		const error = new Error("Quest not found");
		mockQuestController.startQuest.mockRejectedValue(error);

		const result = await useCase.execute("invalid-quest");

		expect(result.success).toBe(false);
		expect(result.quest).toBeNull();
		expect(result.error).toBe(error);
	});
});
