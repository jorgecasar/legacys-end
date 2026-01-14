import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameEvents } from "../core/event-bus.js";
import { CompleteQuestUseCase } from "./complete-quest.js";

describe("CompleteQuestUseCase", () => {
	/** @type {CompleteQuestUseCase} */
	let useCase;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockQuest;
	/** @type {any} */
	let mockEventBus;
	/** @type {any} */
	let mockLogger;

	beforeEach(() => {
		// Create mock quest
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapters: [],
		};

		// Create mock quest controller
		mockQuestController = {
			currentQuest: mockQuest,
			progressService: {
				completeQuest: vi.fn(),
			},
		};

		mockEventBus = {
			emit: vi.fn(),
		};

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		};

		useCase = new CompleteQuestUseCase({
			questController: mockQuestController,
			eventBus: mockEventBus,
			logger: /** @type {any} */ (mockLogger),
		});
	});

	it("should complete quest successfully", () => {
		const result = useCase.execute();

		expect(result.success).toBe(true);
		expect(result.questId).toBe("test-quest");
		expect(
			mockQuestController.progressService.completeQuest,
		).toHaveBeenCalledWith("test-quest");
	});

	it("should emit QUEST_COMPLETE event", () => {
		useCase.execute();

		expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.QUEST_COMPLETE, {
			questId: "test-quest",
			quest: mockQuest,
		});
	});

	it("should handle no active quest", () => {
		mockQuestController.currentQuest = null;

		const result = useCase.execute();

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
		expect(
			mockQuestController.progressService.completeQuest,
		).not.toHaveBeenCalled();
	});

	it("should handle errors gracefully", () => {
		mockQuestController.progressService.completeQuest.mockImplementation(() => {
			throw new Error("Completion failed");
		});

		const result = useCase.execute();

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should emit ERROR event on failure", () => {
		mockQuestController.progressService.completeQuest.mockImplementation(() => {
			throw new Error("Completion failed");
		});

		useCase.execute();

		expect(mockEventBus.emit).toHaveBeenCalledWith(
			GameEvents.ERROR,
			expect.objectContaining({
				message: "Failed to complete quest",
			}),
		);
	});

	it("should log completion", () => {
		// Just verify it doesn't throw
		expect(() => useCase.execute()).not.toThrow();
	});
});
