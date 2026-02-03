import { LevelDialogSlideNarrative } from "./LevelDialogSlideNarrative.js";

if (!customElements.get("level-dialog-slide-narrative")) {
	customElements.define(
		"level-dialog-slide-narrative",
		LevelDialogSlideNarrative,
	);
}
