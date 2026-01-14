import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus, GameEvents } from "../core/event-bus.js";
import { StartQuestUseCase } from "./start-quest.js";

describe("StartQuestUseCase", () => {
	/** @type {StartQuestUseCase} */
	let useCase;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockQuest;

	beforeEach(() => {
		// Clear event bus
		eventBus.clear();

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
			eventBus,
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

	it("should emit LOADING_START event", async () => {
		const listener = vi.fn();
		eventBus.on(GameEvents.LOADING_START, listener);

		await useCase.execute("test-quest");

		expect(listener).toHaveBeenCalledWith({ source: "startQuest" });
	});

	it("should emit LOADING_END event", async () => {
		const listener = vi.fn();
		eventBus.on(GameEvents.LOADING_END, listener);

		await useCase.execute("test-quest");

		expect(listener).toHaveBeenCalledWith({ source: "startQuest" });
	});

	it("should handle errors gracefully", async () => {
		const error = new Error("Quest not found");
		mockQuestController.startQuest.mockRejectedValue(error);

		const result = await useCase.execute("invalid-quest");

		expect(result.success).toBe(false);
		expect(result.quest).toBeNull();
		expect(result.error).toBe(error);
	});

	it("should emit ERROR event on failure", async () => {
		const error = new Error("Quest not found");
		mockQuestController.startQuest.mockRejectedValue(error);

		const listener = vi.fn();
		eventBus.on(GameEvents.ERROR, listener);

		await useCase.execute("invalid-quest");

		expect(listener).toHaveBeenCalledWith({
			message: "Failed to start quest",
			error,
			context: { questId: "invalid-quest" },
		});
	});

	it("should emit LOADING_END even on error", async () => {
		mockQuestController.startQuest.mockRejectedValue(new Error("Test error"));

		const listener = vi.fn();
		eventBus.on(GameEvents.LOADING_END, listener);

		await useCase.execute("test-quest");

		expect(listener).toHaveBeenCalledWith({ source: "startQuest" });
	});
});
