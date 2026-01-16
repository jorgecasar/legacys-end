import { beforeEach, describe, expect, it } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { PauseGameCommand } from "./pause-game-command.js";

describe("PauseGameCommand", () => {
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {PauseGameCommand} */
	let command;

	beforeEach(() => {
		fakeGameState = new FakeGameStateService();
		fakeGameState.isPaused.set(false);
		command = new PauseGameCommand({ worldState: fakeGameState.worldState });
	});

	it("should toggle pause state from false to true", () => {
		command.execute();
		expect(fakeGameState.isPaused.get()).toBe(true);
	});

	it("should toggle pause state from true to false", () => {
		fakeGameState.isPaused.set(true);
		command = new PauseGameCommand({ worldState: fakeGameState.worldState });

		command.execute();
		expect(fakeGameState.isPaused.get()).toBe(false);
	});

	it("should save previous pause state", () => {
		command.execute();
		expect(command.previousPauseState).toBe(false);
	});

	it("should undo to previous pause state", () => {
		command.execute();
		expect(fakeGameState.isPaused.get()).toBe(true);

		command.undo();
		expect(fakeGameState.isPaused.get()).toBe(false);
	});

	it("should update metadata with new state", () => {
		command.execute();
		expect(/** @type {any} */ (command.metadata).newState).toBe(true);
	});

	it("should have correct name", () => {
		expect(command.name).toBe("PauseGame");
	});
});
