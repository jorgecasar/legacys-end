import { GameEvents } from "../core/event-bus.js";

/**
 * Command to go to the previous slide in the level dialog.
 */
export class PrevDialogSlideCommand {
	/**
	 * @param {import('../core/event-bus.js').EventBus} eventBus
	 */
	constructor(eventBus) {
		this.eventBus = eventBus;
		this.name = "PrevDialogSlideCommand";
	}

	execute() {
		if (this.eventBus) {
			this.eventBus.emit(GameEvents.DIALOG_PREV);
		}
	}
}
