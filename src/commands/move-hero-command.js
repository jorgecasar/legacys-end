import { GameEvents } from "../core/event-bus.js";

/**
 * MoveHeroCommand
 *
 * Command to move the hero character.
 * Supports undo to restore previous position.
 */
export class MoveHeroCommand {
	/**
	 * @param {Object} params
	 * @param {import('../services/game-state-service.js').GameStateService} params.gameState
	 * @param {import('../core/event-bus.js').EventBus} [params.eventBus]
	 * @param {number} params.dx - Delta X (change in X position)
	 * @param {number} params.dy - Delta Y (change in Y position)
	 * @param {() => void} [params.onMove] - Optional callback after move
	 */
	constructor({ gameState, dx, dy, onMove, eventBus }) {
		this.gameState = gameState;
		this.eventBus = eventBus;
		this.dx = dx;
		this.dy = dy;
		this.onMove = onMove;
		/** @type {{x: number, y: number} | null} */
		this.previousPos = null;
		this.name = "MoveHero";
		this.metadata = { dx, dy };
	}

	/**
	 * Check if command can execute
	 * @returns {boolean}
	 */
	canExecute() {
		const state = this.gameState.getState();
		const canMove = !state.isPaused && !state.isEvolving;
		return canMove;
	}

	/**
	 * Execute the move
	 */
	execute() {
		const current = this.gameState.getState().heroPos;

		// Save previous position for undo
		this.previousPos = { x: current.x, y: current.y };

		// Execute move
		const nextX = Math.max(0, Math.min(100, current.x + this.dx));
		const nextY = Math.max(0, Math.min(100, current.y + this.dy));

		this.gameState.setHeroPosition(nextX, nextY);

		// Trigger callback if provided
		this.onMove?.();

		this._emitMoveEvent();
	}

	/**
	 * Undo the move
	 */
	undo() {
		if (this.previousPos) {
			this.gameState.setHeroPosition(this.previousPos.x, this.previousPos.y);

			// Trigger callback if provided
			this.onMove?.();

			this._emitMoveEvent();
		}
	}

	_emitMoveEvent() {
		if (this.eventBus) {
			const state = this.gameState.getState();
			this.eventBus.emit(GameEvents.HERO_MOVED, {
				x: state.heroPos.x,
				y: state.heroPos.y,
				hasCollectedItem: state.hasCollectedItem,
			});
		}
	}
}
