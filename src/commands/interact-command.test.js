import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteractCommand } from "./interact-command.js";

describe("InteractCommand", () => {
	/** @type {any} */
	let mockController;
	/** @type {InteractCommand} */
	let command;

	beforeEach(() => {
		mockController = {
			handleInteract: vi.fn(),
		};

		command = new InteractCommand({
			interactionController: mockController,
		});
	});

	it("should have correct name", () => {
		expect(command.name).toBe("Interact");
	});

	it("should execute handleInteract on controller", () => {
		const result = command.execute();

		expect(mockController.handleInteract).toHaveBeenCalled();
		expect(result).toEqual({ success: true });
	});
});
