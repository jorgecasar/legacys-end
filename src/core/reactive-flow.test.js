import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestController } from "../controllers/quest-controller.js";
import { HeroStateService } from "../game/services/hero-state-service.js";
import { QuestStateService } from "../game/services/quest-state-service.js";
import { WorldStateService } from "../game/services/world-state-service.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { SessionService } from "../services/session-service.js";

// Mock Registry for tests
const mockQuestRegistry =
	/** @type {import('../services/quest-registry-service.js').QuestRegistryService} */ (
		/** @type {unknown} */ ({
			loadQuestData: async (/** @type {string} */ id) => ({
				id,
				name: "Test Quest",
				chapterIds: ["c1"],
				chapters: { c1: { id: "c1", title: "Chapter 1" } },
			}),
			getQuest: (/** @type {string} */ id) => ({
				id,
				name: "Test Quest",
				chapterIds: ["c1"],
				chapters: { c1: { id: "c1", title: "Chapter 1" } },
			}),
			getAvailableQuests: () => [],
			isQuestLocked: () => false,
			isQuestAvailable: () => true,
		})
	);

describe("Reactive Flow Integration", () => {
	/** @type {any} */
	let context;
	/** @type {QuestController} */
	let questController;
	/** @type {any} */
	let host;

	beforeEach(() => {
		const heroState = new HeroStateService();
		const questState = new QuestStateService();
		const worldState = new WorldStateService();
		const sessionService = new SessionService();
		const progressService = new FakeProgressService(mockQuestRegistry);
		progressService.progress.unlockedQuests = ["quest-1"];

		host = {
			addController: vi.fn(),
			requestUpdate: vi.fn(),
		};

		questController = new QuestController(host, {
			heroState,
			state: questState,
			worldState,
			sessionService,
			progressService,
			registry: mockQuestRegistry,
			logger: {
				info: () => {},
				error: () => {},
				warn: () => {},
				debug: () => {},
			},
		});

		context = {
			heroState,
			questState,
			worldState,
			sessionService,
			progressService,
			questController,
		};
	});

	it("should update isInHub signal when startQuest is executed", async () => {
		// Initial state
		expect(context.sessionService.isInHub.get()).toBe(true);

		await context.questController.startQuest("quest-1");

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(false);
		expect(context.sessionService.currentQuest.get()).not.toBeNull();
		expect(context.sessionService.currentQuest.get()?.id).toBe("quest-1");
	});

	it("should update isInHub signal when returnToHub is executed", async () => {
		// Manually set to started state
		context.sessionService.setIsInHub(false);
		context.sessionService.setCurrentQuest({ id: "quest-1" });

		await context.questController.returnToHub();

		// High-level assertion on the reactive state
		expect(context.sessionService.isInHub.get()).toBe(true);
		expect(context.sessionService.currentQuest.get()).toBeNull();
	});
});
