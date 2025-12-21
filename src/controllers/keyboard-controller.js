/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

/**
 * @typedef {Object} KeyboardOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 * @property {(dx: number, dy: number) => void} [onMove] - Callback for movement input
 * @property {() => void} [onInteract] - Callback for interaction (Space key)
 * @property {() => void} [onPause] - Callback for pause (Escape key)
 * @property {() => boolean} [isEnabled] - Function to check if input is enabled
 */

/**
 * KeyboardController - Lit Reactive Controller for keyboard input
 *
 * Handles:
 * - Movement keys (WASD, Arrow keys)
 * - Interaction key (Space)
 * - Pause key (Escape)
 * - Prevents default browser behavior
 *
 * @implements {ReactiveController}
 */
export class KeyboardController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<KeyboardOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {KeyboardOptions} */
		this.options = {
			speed: 2.5,
			onMove: () => {},
			onInteract: () => {},
			onPause: () => {},
			isEnabled: () => true,
			...options,
		};

		host.addController(this);
	}

	hostConnected() {
		this.handleKeyDown = this.handleKeyDown.bind(this);
		window.addEventListener("keydown", this.handleKeyDown);
	}

	hostDisconnected() {
		window.removeEventListener("keydown", this.handleKeyDown);
	}

	/**
	 * Handle keyboard events
	 * @param {KeyboardEvent} e
	 */
	handleKeyDown(e) {
		// Handle Pause (Escape) - Always allowed unless specifically blocked by logic outside
		if (e.code === "Escape") {
			e.preventDefault();
			this.options.onPause();
			return;
		}

		// Check if input is enabled
		if (!this.options.isEnabled()) {
			return;
		}

		// Handle interaction (Space)
		if (e.code === "Space") {
			e.preventDefault();
			this.options.onInteract();
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
			this.options.onMove(moveX, moveY);
		}
	}
}
