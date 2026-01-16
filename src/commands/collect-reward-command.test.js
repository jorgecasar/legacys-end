import { beforeEach, describe, expect, it } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { CollectRewardCommand } from "./collect-reward-command.js";

describe("CollectRewardCommand", () => {
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {CollectRewardCommand} */
	let command;

	beforeEach(() => {
		fakeGameState = new FakeGameStateService();
		command = new CollectRewardCommand({
			questState: fakeGameState.questState,
		});
	});

	it("should set reward collected to true", () => {
		command.execute();
		expect(fakeGameState.isRewardCollected.get()).toBe(true);
	});

	it("should undo by setting reward collected to false", () => {
		command.execute();
		// Pre-condition
		expect(fakeGameState.isRewardCollected.get()).toBe(true);

		command.undo();
		expect(fakeGameState.isRewardCollected.get()).toBe(false);
	});
});
