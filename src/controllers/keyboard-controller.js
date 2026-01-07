/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('../commands/command-bus.js').CommandBus} CommandBus
 */

/**
 * @typedef {Object} KeyboardOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 * @property {CommandBus} [commandBus] - Unified command execution
 * @property {(dx: number, dy: number) => void} [onMove] - Callback for movement input
 * @property {() => void} [onInteract] - Callback for interaction (Space key)
 * @property {() => void} [onPause] - Callback for pause (Escape key)
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
			commandBus: undefined,
			onMove: () => {},
			onInteract: () => {},
			onPause: () => {},
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
		// Handle Undo/Redo (Ctrl+Z / Ctrl+Y or Shift+Ctrl+Z)
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
			e.preventDefault();
			if (e.shiftKey) {
				this.options.commandBus?.redo();
			} else {
				this.options.commandBus?.undo();
			}
			return;
		}

		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
			e.preventDefault();
			this.options.commandBus?.redo();
			return;
		}

		// Handle Pause (Escape) - Always allowed
		if (e.code === "Escape") {
			e.preventDefault();
			this.options.onPause?.();
			return;
		}

		// Handle interaction (Space)
		if (e.code === "Space") {
			e.preventDefault();
			this.options.onInteract?.();
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
			this.options.onMove?.(moveX, moveY);
		}
	}
}
