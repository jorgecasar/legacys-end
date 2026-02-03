import { LevelDialogSlideConfirmation } from "./LevelDialogSlideConfirmation.js";

if (!customElements.get("level-dialog-slide-confirmation")) {
	customElements.define(
		"level-dialog-slide-confirmation",
		LevelDialogSlideConfirmation,
	);
}
