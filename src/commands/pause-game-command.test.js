import { beforeEach, describe, expect, it, vi } from "vitest";
import { PauseGameCommand } from "./pause-game-command.js";

describe("PauseGameCommand", () => {
	/** @type {any} */
	let mockGameState;
	/** @type {PauseGameCommand} */
	let command;

	beforeEach(() => {
		mockGameState = {
			getState: vi.fn().mockReturnValue({
				isPaused: false,
			}),
			setPaused: vi.fn(),
		};

		command = new PauseGameCommand({ gameState: mockGameState });
	});

	it("should toggle pause state from false to true", () => {
		command.execute();

		expect(mockGameState.setPaused).toHaveBeenCalledWith(true);
	});

	it("should toggle pause state from true to false", () => {
		mockGameState.getState.mockReturnValue({ isPaused: true });
		command = new PauseGameCommand({ gameState: mockGameState });

		command.execute();

		expect(mockGameState.setPaused).toHaveBeenCalledWith(false);
	});

	it("should save previous pause state", () => {
		command.execute();

		expect(command.previousPauseState).toBe(false);
	});

	it("should undo to previous pause state", () => {
		command.execute();

		command.undo();

		expect(mockGameState.setPaused).toHaveBeenCalledWith(false);
	});

	it("should update metadata with new state", () => {
		command.execute();

		expect(/** @type {any} */ (command.metadata).newState).toBe(true);
	});

	it("should have correct name", () => {
		expect(command.name).toBe("PauseGame");
	});
});
