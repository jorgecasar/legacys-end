/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

/**
 * @typedef {Object} KeyboardOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 */

/**
 * KeyboardController - Lit Reactive Controller for keyboard input
 *
 * Handles:
 * - Movement keys (WASD, Arrow keys) -> HERO_MOVE_INPUT
 * - Interaction key (Space) -> interaction.handleInteract()
 * - Pause key (Escape) -> worldState.setPaused()
 *
 * @implements {ReactiveController}
 */
export class KeyboardController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<KeyboardOptions & import('../core/game-context.js').IGameContext & {interaction: import('../services/interfaces.js').IInteractionController | null}>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		this.options = {
			speed: 2.5,
			interaction: null,
			worldState: null,
			...options,
		};

		host.addController(this);
	}

	hostConnected() {
		this.handleKeyDown = this.handleKeyDown.bind(this);
		window.addEventListener("keydown", this.handleKeyDown);
		console.log("KeyboardController connected, listener added");
	}

	hostDisconnected() {
		window.removeEventListener("keydown", this.handleKeyDown);
	}

	/**
	 * Handle keyboard events
	 * @param {KeyboardEvent} e
	 */
	handleKeyDown(e) {
		const { interaction, worldState } = this.options;

		// Handle Pause (Escape) - Always allowed
		if (e.code === "Escape") {
			e.preventDefault();
			if (worldState) {
				worldState.setPaused(!worldState.isPaused.get());
			}
			return;
		}

		// Handle interaction (Space)
		if (e.code === "Space" || e.key === " ") {
			// throw new Error("DEBUG: KeyDownSpace REACHED");
			e.preventDefault();
			const effectiveInteraction =
				/** @type {import('lit').ReactiveControllerHost & { interaction?: import('../services/interfaces.js').IInteractionController }} */ (
					this.host
				).interaction || interaction;

			if (effectiveInteraction) {
				effectiveInteraction.handleInteract();
			}
			return;
		}

		// Handle movement
		const speed = this.options.speed || 2.5;
		let moveX = 0;
		let moveY = 0;

		if (["ArrowUp", "w", "W"].includes(e.key)) {
			moveY -= speed;
			e.preventDefault();
		}
		if (["ArrowDown", "s", "S"].includes(e.key)) {
			moveY += speed;
			e.preventDefault();
		}
		if (["ArrowLeft", "a", "A"].includes(e.key)) {
			moveX -= speed;
			e.preventDefault();
		}
		if (["ArrowRight", "d", "D"].includes(e.key)) {
			moveX += speed;
			e.preventDefault();
		}

		if (moveX !== 0 || moveY !== 0) {
			if (typeof (/** @type {any} */ (this.host).handleMove) === "function") {
				/** @type {any} */ (this.host).handleMove(moveX, moveY);
			}
		}
	}
}
