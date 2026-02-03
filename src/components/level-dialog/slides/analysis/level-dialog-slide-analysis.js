import { LevelDialogSlideAnalysis } from "./LevelDialogSlideAnalysis.js";

if (!customElements.get("level-dialog-slide-analysis")) {
	customElements.define(
		"level-dialog-slide-analysis",
		LevelDialogSlideAnalysis,
	);
}
