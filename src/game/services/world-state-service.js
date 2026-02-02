import { Signal } from "@lit-labs/signals";

/** @typedef {import('../interfaces.js').IWorldStateService} IWorldStateService */

/**
 * WorldStateService - Manages engine and environmental state
 * @implements {IWorldStateService}
 */
export class WorldStateService {
	constructor() {
		this.isPaused = new Signal.State(false);
		this.showDialog = new Signal.State(false);
		this.currentDialogText = new Signal.State("");
		this.nextDialogText = new Signal.State("");
		this.currentSlideIndex = new Signal.State(0);
	}

	/**
	 * @param {boolean} paused
	 */
	setPaused(paused) {
		this.isPaused.set(paused);
	}

	/**
	 * @param {boolean} show
	 */
	setShowDialog(show) {
		this.showDialog.set(show);
		if (show) {
			this.resetSlideIndex();
		}
	}

	/**
	 * @param {string} text
	 */
	setCurrentDialogText(text) {
		this.currentDialogText.set(text || "");
	}

	/**
	 * @param {string} text
	 */
	setNextDialogText(text) {
		this.nextDialogText.set(text || "");
	}

	nextSlide() {
		this.currentSlideIndex.set(this.currentSlideIndex.get() + 1);
	}

	prevSlide() {
		this.currentSlideIndex.set(Math.max(this.currentSlideIndex.get() - 1, 0));
	}

	/**
	 * @param {number} index
	 */
	setSlideIndex(index) {
		this.currentSlideIndex.set(index);
	}

	resetSlideIndex() {
		this.currentSlideIndex.set(0);
	}
}
