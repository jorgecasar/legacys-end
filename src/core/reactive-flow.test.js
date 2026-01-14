import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToHubCommand } from "../commands/return-to-hub-command.js";
import { StartQuestCommand } from "../commands/start-quest-command.js";
import { GameSessionManager } from "../managers/game-session-manager.js";
import { FakeProgressService } from "../services/fakes/fake-progress-service.js";
import { GameStateService } from "../services/game-state-service.js";
import * as questRegistry from "../services/quest-registry-service.js";

describe("Reactive Flow Integration", () => {
	/** @type {GameStateService} */
	let gameState;
	/** @type {GameSessionManager} */
	let sessionManager;
	/** @type {any} */
	let mockQuestController;

	beforeEach(() => {
		gameState = new GameStateService();
		mockQuestController = {
			loadQuest: async (/** @type {string} */ id) => ({
				id,
				name: "Test Quest",
			}),
			continueQuest: async (/** @type {string} */ id) => ({
				id,
				name: "Test Quest",
			}),
			startQuest: () => ({ id: "quest-1", name: "Test Quest" }),
			returnToHub: () => {},
			currentQuest: { id: "quest-1", name: "Test Quest" },
		};

		sessionManager = new GameSessionManager({
			gameState,
			progressService: new FakeProgressService(questRegistry),
			questController: mockQuestController,
			eventBus: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
			logger: {
				info: () => {},
				error: () => {},
				warn: () => {},
				debug: () => {},
			},
		});
	});

	it("should update isInHub signal when StartQuestCommand is executed", async () => {
		// Initial state
		expect(sessionManager.isInHub.get()).toBe(true);

		const command = new StartQuestCommand({
			sessionManager,
			questId: "quest-1",
		});

		await command.execute();

		// High-level assertion on the reactive state
		expect(sessionManager.isInHub.get()).toBe(false);
		expect(sessionManager.currentQuest.get()).not.toBeNull();
		expect(sessionManager.currentQuest.get()?.id).toBe("quest-1");
	});

	it("should update isInHub signal when ReturnToHubCommand is executed", async () => {
		// Manually set to started state
		sessionManager.isInHub.set(false);
		sessionManager.currentQuest.set(/** @type {any} */ ({ id: "quest-1" }));

		const command = new ReturnToHubCommand({
			sessionManager,
		});

		await command.execute();

		// High-level assertion on the reactive state
		expect(sessionManager.isInHub.get()).toBe(true);
		expect(sessionManager.currentQuest.get()).toBeNull();
	});
});
