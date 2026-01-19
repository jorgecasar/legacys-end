import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { QuestLoaderService } from "../services/quest-loader-service.js";
import { SessionService } from "../services/session-service.js";

// Mock Registry for tests
const mockQuestRegistry =
	/** @type {import('../services/quest-registry-service.js').QuestRegistryService} */ (
		/** @type {unknown} */ ({
			getQuest: () => null,
			getAllQuests: () => [],
			isQuestLocked: () => false,
		})
	);

describe("Reactive Flow Integration", () => {
	/** @type {any} */
	let context;
	/** @type {QuestLoaderService} */
	let questLoader;

	beforeEach(() => {
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();

		context = {
			heroState,
			questState,
			worldState,
			sessionService: new SessionService(),
			progressService: new FakeProgressService(mockQuestRegistry),
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

		await questLoader.startQuest("quest-1");

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(false);
		expect(context.sessionService.currentQuest.get()).not.toBeNull();
		expect(context.sessionService.currentQuest.get()?.id).toBe("quest-1");
	});

	it("should update isInHub signal when ReturnToHubCommand is executed", async () => {
		// Manually set to started state
		context.sessionService.setIsInHub(false);
		context.sessionService.setCurrentQuest({ id: "quest-1" });

		// Mock return use case
		vi.spyOn(
			/** @type {any} */ (questLoader)._returnToHubUseCase,
			"execute",
		).mockResolvedValue({
			success: true,
		});

		await questLoader.returnToHub();

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(true);
		expect(context.sessionService.currentQuest.get()).toBeNull();
	});
});
