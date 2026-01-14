import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameEvents } from "../core/event-bus.js";
import { ContinueQuestUseCase } from "./continue-quest.js";

describe("ContinueQuestUseCase", () => {
	/** @type {ContinueQuestUseCase} */
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
		mockQuest = {
			id: "test-quest",
			name: "Test Quest",
			chapters: [],
		};

		mockQuestController = {
			continueQuest: vi.fn().mockResolvedValue(undefined),
			currentQuest: mockQuest,
		};

		mockEventBus = {
			emit: vi.fn(),
			on: vi.fn(),
			clear: vi.fn(),
		};

		mockLogger = {
			error: vi.fn(),
		};

		useCase = new ContinueQuestUseCase({
			questController: mockQuestController,
			eventBus: mockEventBus,
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

	it("should emit LOADING_START event", async () => {
		// Simulate event bus behavior matching usage?
		// Or verify emit called on mockEventBus?
		// The test was checking real event bus subscription.
		// Since we mock eventBus, we verify .emit is called.

		await useCase.execute("test-quest");

		expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.LOADING_START, {
			source: "continueQuest",
		});

		await useCase.execute("test-quest");

		// Check emission directly
	});

	it("should emit LOADING_END event", async () => {
		await useCase.execute("test-quest");

		expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.LOADING_END, {
			source: "continueQuest",
		});

		await useCase.execute("test-quest");

		// Check emission directly
	});

	it("should handle errors gracefully", async () => {
		const error = new Error("Quest not found");
		mockQuestController.continueQuest.mockRejectedValue(error);

		const result = await useCase.execute("invalid-quest");

		expect(result.success).toBe(false);
		expect(result.quest).toBeNull();
		expect(result.error).toBe(error);
	});

	it("should emit ERROR event on failure", async () => {
		const error = new Error("Quest not found");
		mockQuestController.continueQuest.mockRejectedValue(error);

		await useCase.execute("invalid-quest");

		expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.ERROR, {
			message: "Failed to continue quest",
			error,
			context: { questId: "invalid-quest" },
		});

		await useCase.execute("invalid-quest");

		// Checked above
	});

	it("should emit LOADING_END even on error", async () => {
		mockQuestController.continueQuest.mockRejectedValue(
			new Error("Test error"),
		);

		await useCase.execute("test-quest");

		expect(mockEventBus.emit).toHaveBeenCalledWith(GameEvents.LOADING_END, {
			source: "continueQuest",
		});

		await useCase.execute("test-quest");

		// Check emission directly
	});
});
