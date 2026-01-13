import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubUseCase } from "./return-to-hub.js";

describe("ReturnToHubUseCase", () => {
	/** @type {ReturnToHubUseCase} */
	let useCase;
	/** @type {any} */
	let mockQuestController;

	/** @type {any} */
	let mockLogger;

	beforeEach(() => {
		mockQuestController = {
			currentQuest: { id: "test-quest" },
			returnToHub: vi.fn(),
		};

		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
		};

		useCase = new ReturnToHubUseCase({
			questController: mockQuestController,
			logger: /** @type {any} */ (mockLogger),
		});
	});

	it("should return success and call returnToHub", () => {
		const result = useCase.execute();

		expect(result.success).toBe(true);
		expect(mockQuestController.returnToHub).toHaveBeenCalled();
	});

	it("should not call returnToHub if no current quest", () => {
		mockQuestController.currentQuest = null;
		useCase.execute();
		expect(mockQuestController.returnToHub).not.toHaveBeenCalled();
	});

	it("should handle mistakes in questController.returnToHub", () => {
		const error = new Error("Quest Error");
		mockQuestController.returnToHub.mockImplementation(() => {
			throw error;
		});

		const result = useCase.execute();

		expect(result.success).toBe(false);
		expect(result.error).toBe(error);
	});
});
