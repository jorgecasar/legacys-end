import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubCommand } from "../commands/return-to-hub-command.js";
import { StartQuestCommand } from "../commands/start-quest-command.js";
import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { GameStateService } from "../services/game-state-service.js";
import { QuestLoaderService } from "../services/quest-loader-service.js";
import * as questRegistry from "../services/quest-registry-service.js";
import { SessionService } from "../services/session-service.js";

describe("Reactive Flow Integration", () => {
	/** @type {any} */
	let context;
	/** @type {QuestLoaderService} */
	let questLoader;
	/** @type {GameStateService} */
	let gameState;

	beforeEach(() => {
		gameState = new GameStateService();
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		context = {
			gameState,
			heroState,
			questState,
			worldState,
			sessionService: new SessionService(),
			progressService: new FakeProgressService(questRegistry),
			questController: {
				loadQuest: async (/** @type {string} */ id) => ({
					id,
					name: "Test Quest",
				}),
				continueQuest: async (/** @type {string} */ id) => ({
					id,
					name: "Test Quest",
				}),
				jumpToChapter: () => true,
				startQuest: () => ({ id: "quest-1", name: "Test Quest" }),
				returnToHub: () => {},
				currentQuest: { id: "quest-1", name: "Test Quest" },
			},
			eventBus: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
			logger: {
				info: () => {},
				error: () => {},
				warn: () => {},
				debug: () => {},
			},
		};

		questLoader = new QuestLoaderService(context);
		// Mock internal use cases calls to avoid complex logic if needed,
		// but ideally we test the flow. For now, let's keep it real or mocked.
		// StartQuestUseCase calls check requirements.
		// The test expects executing StartQuestCommand -> questLoader.startQuest -> updates sessionService.
	});

	it("should update isInHub signal when StartQuestCommand is executed", async () => {
		// Initial state
		expect(context.sessionService.isInHub.get()).toBe(true);

		const command = new StartQuestCommand({
			questLoader,
			questId: "quest-1",
		});

		// Mock use case result for startQuest to simplify test dependency on quest registry validation
		// OR we can rely on questLoader's logic.
		// questLoader.startQuest calls _startQuestUseCase.execute
		// We'll mock the startQuest method of questLoader for this unit test if we want to isolate command -> loader

		// The original test tested "Reactive Flow Integration" testing the command effect on manager.
		// Now commands delegate to questLoader.

		// Let's spy on questLoader.startQuest to let it run but we need to ensure use cases work or are mocked.
		// Simpler: Just mock use case execution inside questLoader?
		// Or mock questRegistry properly?
		// The mockQuestController provided returns quest data.

		// Let's rely on questLoader's real logic but mock `_startQuestUseCase` on the instance?
		// Too internal.

		// Let's just fix the test to call everything normally.
		// NOTE: StartQuestUseCase checks `progressService.isQuestAvailable`.
		// FakeProgressService might return false?
		// Re-instantiate FakeProgressService? It's imported.

		// Let's Mock StartQuestUseCase to return success.
		// Let's Mock StartQuestUseCase to return success.
		vi.spyOn(
			/** @type {any} */ (questLoader)._startQuestUseCase,
			"execute",
		).mockResolvedValue({
			success: true,
			quest: { id: "quest-1", name: "Test Quest" },
		});

		await command.execute();

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(false);
		expect(context.sessionService.currentQuest.get()).not.toBeNull();
		expect(context.sessionService.currentQuest.get()?.id).toBe("quest-1");
	});

	it("should update isInHub signal when ReturnToHubCommand is executed", async () => {
		// Manually set to started state
		context.sessionService.setIsInHub(false);
		context.sessionService.setCurrentQuest({ id: "quest-1" });

		const command = new ReturnToHubCommand({
			questLoader,
		});

		// Mock return use case
		// Mock return use case
		vi.spyOn(
			/** @type {any} */ (questLoader)._returnToHubUseCase,
			"execute",
		).mockResolvedValue({
			success: true,
		});

		await command.execute();

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(true);
		expect(context.sessionService.currentQuest.get()).toBeNull();
	});
});
