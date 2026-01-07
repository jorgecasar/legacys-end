import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToggleHotSwitchCommand } from "./toggle-hot-switch-command.js";

describe("ToggleHotSwitchCommand", () => {
	/** @type {any} */
	let mockGameState;
	/** @type {ToggleHotSwitchCommand} */
	let command;

	beforeEach(() => {
		mockGameState = {
			getState: vi.fn(),
			setHotSwitchState: vi.fn(),
		};
	});

	it("should toggle from legacy to new", () => {
		mockGameState.getState.mockReturnValue({ hotSwitchState: "legacy" });
		command = new ToggleHotSwitchCommand({ gameState: mockGameState });

		command.execute();

		expect(mockGameState.setHotSwitchState).toHaveBeenCalledWith("new");
	});

	it("should toggle from new to legacy", () => {
		mockGameState.getState.mockReturnValue({ hotSwitchState: "new" });
		command = new ToggleHotSwitchCommand({ gameState: mockGameState });

		command.execute();

		expect(mockGameState.setHotSwitchState).toHaveBeenCalledWith("legacy");
	});

	it("should undo to previous state", () => {
		mockGameState.getState.mockReturnValue({ hotSwitchState: "legacy" });
		command = new ToggleHotSwitchCommand({ gameState: mockGameState });

		command.execute();
		mockGameState.setHotSwitchState.mockClear();

		command.undo();

		expect(mockGameState.setHotSwitchState).toHaveBeenCalledWith("legacy");
	});
});
