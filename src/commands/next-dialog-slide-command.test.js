import { describe, expect, it, vi } from "vitest";
import { NextDialogSlideCommand } from "./next-dialog-slide-command.js";

describe("NextDialogSlideCommand", () => {
	it("should call nextDialogSlide on the gameView", () => {
		const mockGameView = {
			nextDialogSlide: vi.fn(),
		};
		const command = new NextDialogSlideCommand(
			/** @type {any} */ (mockGameView),
		);

		command.execute();

		expect(mockGameView.nextDialogSlide).toHaveBeenCalled();
	});

	it("should do nothing if gameView is not provided", () => {
		const command = new NextDialogSlideCommand(/** @type {any} */ (null));
		expect(() => command.execute()).not.toThrow();
	});
});
