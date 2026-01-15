import { GameStateService } from "../game-state-service.js";

/**
 * FakeGameStateService
 * A concrete implementation of GameStateService that runs in-memory.
 * Since GameStateService is already reactive and logic-less (mostly),
 * this class primarily serves to disambiguate "Real" vs "Test" intent.
 */
export class FakeGameStateService extends GameStateService {
	constructor() {
		super(undefined); // No logger needed for tests usually
	}

	// Helper to inspect state easily in tests
	get current() {
		return {
			heroPos: this.heroPos.get(),
			isPaused: this.isPaused.get(),
			isQuestCompleted: this.isQuestCompleted.get(),
			isInHub: true, // Derived usually, but checking core state
			// ... add others as needed
		};
	}
}
