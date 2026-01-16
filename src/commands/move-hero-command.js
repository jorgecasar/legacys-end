/**
 * MoveHeroCommand
 *
 * Command to move the hero character.
 * Supports undo to restore previous position.
 */
export class MoveHeroCommand {
	/**
	 * @param {Object} params
	 * @param {import('../game/services/hero-state-service.js').HeroStateService} params.heroState
	 * @param {import('../game/interfaces.js').IWorldStateService} [params.worldState]
	 * @param {number} params.dx - Delta X (change in X position)
	 * @param {number} params.dy - Delta Y (change in Y position)
	 * @param {() => void} [params.onMove] - Optional callback after move
	 */
	constructor({ heroState, worldState, dx, dy, onMove }) {
		this.heroState = heroState;
		this.worldState = worldState;
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
		const isPaused = this.worldState?.isPaused.get() ?? false;
		const isEvolving = this.heroState.isEvolving.get();
		return !isPaused && !isEvolving;
	}

	/**
	 * Execute the move
	 */
	execute() {
		const current = this.heroState.pos.get();

		// Save previous position for undo
		this.previousPos = { x: current.x, y: current.y };

		// Execute move
		const nextX = Math.max(0, Math.min(100, current.x + this.dx));
		const nextY = Math.max(0, Math.min(100, current.y + this.dy));

		this.heroState.setPos(nextX, nextY);

		// Trigger callback if provided
		this.onMove?.();
	}

	/**
	 * Undo the move
	 */
	undo() {
		if (this.previousPos) {
			this.heroState.setPos(this.previousPos.x, this.previousPos.y);

			// Trigger callback if provided
			this.onMove?.();
		}
	}
}
