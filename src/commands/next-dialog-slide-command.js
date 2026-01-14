/**
 * Command to advance to the next slide in the level dialog.
 */
export class NextDialogSlideCommand {
	/**
	 * @param {import('../components/game-view/GameView.js').GameView} gameView
	 */
	constructor(gameView) {
		this.gameView = gameView;
		this.name = "NextDialogSlideCommand";
	}

	execute() {
		if (this.gameView) {
			this.gameView.nextDialogSlide();
		}
	}
}
