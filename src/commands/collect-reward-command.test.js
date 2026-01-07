import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollectRewardCommand } from "./collect-reward-command.js";

describe("CollectRewardCommand", () => {
	/** @type {any} */
	let mockGameState;
	/** @type {CollectRewardCommand} */
	let command;

	beforeEach(() => {
		mockGameState = {
			setRewardCollected: vi.fn(),
		};
		command = new CollectRewardCommand({ gameState: mockGameState });
	});

	it("should set reward collected to true", () => {
		command.execute();
		expect(mockGameState.setRewardCollected).toHaveBeenCalledWith(true);
	});

	it("should undo by setting reward collected to false", () => {
		command.execute();
		mockGameState.setRewardCollected.mockClear();

		command.undo();
		expect(mockGameState.setRewardCollected).toHaveBeenCalledWith(false);
	});
});
