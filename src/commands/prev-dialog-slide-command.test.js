import { describe, expect, it, vi } from "vitest";
import { PrevDialogSlideCommand } from "./prev-dialog-slide-command.js";

describe("PrevDialogSlideCommand", () => {
	it("should call prevDialogSlide on the gameView", () => {
		const mockGameView = {
			prevDialogSlide: vi.fn(),
		};
		const command = new PrevDialogSlideCommand(
			/** @type {any} */ (mockGameView),
		);

		command.execute();

		expect(mockGameView.prevDialogSlide).toHaveBeenCalled();
	});

	it("should do nothing if gameView is not provided", () => {
		const command = new PrevDialogSlideCommand(/** @type {any} */ (null));
		expect(() => command.execute()).not.toThrow();
	});
});
