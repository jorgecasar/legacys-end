import { GameEvents } from "../core/event-bus.js";

/**
 * Command to advance to the next slide in the level dialog.
 */
export class NextDialogSlideCommand {
	/**
	 * @param {import('../core/event-bus.js').EventBus} eventBus
	 */
	constructor(eventBus) {
		this.eventBus = eventBus;
		this.name = "NextDialogSlideCommand";
	}

	execute() {
		if (this.eventBus) {
			this.eventBus.emit(GameEvents.DIALOG_NEXT);
		}
	}
}
