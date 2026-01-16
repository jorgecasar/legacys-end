import { beforeEach, describe, expect, it } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { ToggleHotSwitchCommand } from "./toggle-hot-switch-command.js";

describe("ToggleHotSwitchCommand", () => {
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {ToggleHotSwitchCommand} */
	let command;

	beforeEach(() => {
		fakeGameState = new FakeGameStateService();
	});

	it("should toggle from legacy to new", () => {
		fakeGameState.hotSwitchState.set("legacy");
		command = new ToggleHotSwitchCommand({
			heroState: fakeGameState.heroState,
		});

		command.execute();

		expect(fakeGameState.hotSwitchState.get()).toBe("new");
	});

	it("should toggle from new to legacy", () => {
		fakeGameState.hotSwitchState.set("new");
		command = new ToggleHotSwitchCommand({
			heroState: fakeGameState.heroState,
		});

		command.execute();

		expect(fakeGameState.hotSwitchState.get()).toBe("legacy");
	});

	it("should undo to previous state", () => {
		fakeGameState.hotSwitchState.set("legacy");
		command = new ToggleHotSwitchCommand({
			heroState: fakeGameState.heroState,
		});

		command.execute();
		// State is "new"

		command.undo();
		expect(fakeGameState.hotSwitchState.get()).toBe("legacy");
	});
});
