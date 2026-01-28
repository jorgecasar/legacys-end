/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost
 */

/**
 * @typedef {Object} KeyboardOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 */

/**
 * @typedef {ReactiveControllerHost & {
 * 	handleMove?: (dx: number, dy: number) => void,
 * 	handleInteract?: () => void,
 * 	handlePause?: () => void
 * }} HostWithCallbacks
 */

/**
 * KeyboardController - Lit Reactive Controller for keyboard input
 *
 * Handles:
 * - Movement keys (WASD, Arrow keys) -> host.handleMove(dx, dy)
 * - Interaction key (Space) -> host.handleInteract()
 * - Pause key (Escape) -> host.handlePause()
 *
 * @implements {ReactiveController}
 */
export class KeyboardController {
	/**
	 * @param {HostWithCallbacks} host
	 * @param {KeyboardOptions} [options]
	 */
	constructor(host, options = {}) {
		/** @type {HostWithCallbacks} */
		this.host = host;
		this.options = {
			speed: 2.5,
			...options,
		};

		host.addController(this);
	}

	hostConnected() {
		window.addEventListener("keydown", this.#handleKeyDown);
	}

	hostDisconnected() {
		window.removeEventListener("keydown", this.#handleKeyDown);
	}

	/**
	 * Handle keyboard events
	 * @param {KeyboardEvent} e
	 */
	#handleKeyDown = (e) => {
		// Handle Pause (Escape) - Always allowed
		if (e.code === "Escape") {
			e.preventDefault();
			this.#callHostMethod("handlePause");
			return;
		}

		// Handle interaction (Space)
		if (e.code === "Space" || e.key === " ") {
			e.preventDefault();
			this.#callHostMethod("handleInteract");
			return;
		}

		// Handle movement
		const speed = this.options.speed || 2.5;
		let moveX = 0;
		let moveY = 0;

		if (["ArrowUp", "w", "W"].includes(e.key)) {
			moveY -= speed;
		}
		if (["ArrowDown", "s", "S"].includes(e.key)) {
			moveY += speed;
		}
		if (["ArrowLeft", "a", "A"].includes(e.key)) {
			moveX -= speed;
		}
		if (["ArrowRight", "d", "D"].includes(e.key)) {
			moveX += speed;
		}

		if (moveX !== 0 || moveY !== 0) {
			e.preventDefault();
			this.#callHostMethod("handleMove", moveX, moveY);
		}
	};

	/**
	 * Safely call a method on the host if it exists
	 * @param {keyof HostWithCallbacks} methodName
	 * @param {...unknown} args
	 */
	#callHostMethod(methodName, ...args) {
		const host = /** @type {HostWithCallbacks} */ (this.host);

		if (methodName === "handleMove") {
			host.handleMove?.(
				/** @type {number} */ (args[0]),
				/** @type {number} */ (args[1]),
			);
			return;
		}

		if (methodName === "handleInteract") {
			host.handleInteract?.();
			return;
		}

		if (methodName === "handlePause") {
			host.handlePause?.();
		}
	}
}
