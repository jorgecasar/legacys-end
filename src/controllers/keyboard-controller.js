/**
 * KeyboardController - Lit Reactive Controller for keyboard input
 * 
 * Handles:
 * - Movement keys (WASD, Arrow keys)
 * - Interaction key (Space)
 * - Prevents default browser behavior
 * 
 * Usage:
 * ```js
 * this.keyboard = new KeyboardController(this, {
 *   onMove: (dx, dy) => { ... },
 *   onInteract: () => { ... },
 *   isEnabled: () => !this.showDialog && !this.isEvolving
 * });
 * ```
 */
export class KeyboardController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			speed: 2.5,
			onMove: () => { },
			onInteract: () => { },
			onPause: () => { },
			isEnabled: () => true,
			...options
		};

		host.addController(this);
	}

	hostConnected() {
		this.handleKeyDown = this.handleKeyDown.bind(this);
		window.addEventListener('keydown', this.handleKeyDown);
	}

	hostDisconnected() {
		window.removeEventListener('keydown', this.handleKeyDown);
	}

	handleKeyDown(e) {
		// Handle Pause (Escape) - Always allowed unless specifically blocked by logic outside
		if (e.code === 'Escape') {
			e.preventDefault();
			this.options.onPause();
			return;
		}

		// Check if input is enabled
		if (!this.options.isEnabled()) {
			return;
		}

		// Handle interaction (Space)
		if (e.code === 'Space') {
			e.preventDefault();
			this.options.onInteract();
			return;
		}

		// Handle movement
		const speed = this.options.speed;
		let moveX = 0;
		let moveY = 0;

		if (['ArrowUp', 'w', 'W'].includes(e.key)) {
			moveY -= speed;
			e.preventDefault();
		}
		if (['ArrowDown', 's', 'S'].includes(e.key)) {
			moveY += speed;
			e.preventDefault();
		}
		if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
			moveX -= speed;
			e.preventDefault();
		}
		if (['ArrowRight', 'd', 'D'].includes(e.key)) {
			moveX += speed;
			e.preventDefault();
		}

		if (moveX !== 0 || moveY !== 0) {
			this.options.onMove(moveX, moveY);
		}
	}
}
