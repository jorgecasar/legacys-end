import { GameEvents } from "../core/event-bus.js";

/**
 * Command to trigger the hero's auto-movement to a specific position.
 */
export class AutoMoveCommand {
	/**
	 * @param {import('../core/event-bus.js').EventBus} eventBus
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(eventBus, x, y) {
		this.eventBus = eventBus;
		this.x = x;
		this.y = y;
		this.name = "AutoMoveCommand";
	}

	execute() {
		if (this.eventBus) {
			this.eventBus.emit(GameEvents.HERO_AUTO_MOVE, { x: this.x, y: this.y });
		}
	}
}
