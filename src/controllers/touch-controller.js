import { Signal } from "@lit-labs/signals";
import { css, html, nothing } from "lit";

/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

/**
 * @typedef {Object} TouchOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 */

export const touchStyles = css`
	/* Mobile/Touch Controls */
	.touch-controls {
		display: none;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		pointer-events: none;
	}

	@media (pointer: coarse) {
		.touch-controls {
			display: flex;
		}
	}

	.joystick-base {
		width: 100px;
		height: 100px;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border: 2px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		position: relative;
		pointer-events: auto;
		touch-action: none;
		box-shadow: var(--wa-shadow-large);
	}

	.joystick-thumb {
		width: 40px;
		height: 40px;
		background: var(--wa-color-brand);
		border-radius: 50%;
		position: absolute;
		top: calc(50% - 20px);
		left: calc(50% - 20px);
		box-shadow: var(--wa-shadow-medium);
		pointer-events: none;
	}

	.interact-btn {
		display: none;
	}

	@media (max-width: 600px) {
		.joystick-base {
			width: 90px;
			height: 90px;
		}

		.joystick-thumb {
			width: 36px;
			height: 36px;
			top: calc(50% - 18px);
			left: calc(50% - 18px);
		}
	}
`;

/**
 * TouchController - Lit Reactive Controller for mobile touch input
 *
 * Handles:
 * - Virtual joystick for movement
 * - Tap to interact
 *
 * @implements {ReactiveController}
 */
export class TouchController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<TouchOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		this.options = {
			speed: 1.2,
			...options,
		};

		/** @type {boolean} */
		this.isActive = false;
		/** @type {{x: number, y: number} | null} */
		this.startPos = null;
		/** @type {Signal.State<{x: number, y: number}>} */
		this.currentPos = new Signal.State({ x: 0, y: 0 });
		/** @type {number} */
		this.maxDistance = 50; // Max radius for the joystick
		/** @type {number} */
		this.maxTapDistance = 10; // Max distance for a tap
		/** @type {number} */
		this.moveDistance = 0;

		host.addController(this);
	}

	hostConnected() {}

	hostDisconnected() {
		this.#stopMovement();
	}

	/**
	 * Start touch move
	 * @param {Touch} touch
	 */
	handleStart(touch) {
		this.isActive = true;
		this.startPos = { x: touch.clientX, y: touch.clientY };
		this.currentPos.set({ x: 0, y: 0 });
		this.moveDistance = 0;
		this.host.requestUpdate();
	}

	/**
	 * Handle touch move
	 * @param {Touch} touch
	 */
	handleMove(touch) {
		if (!this.isActive || !this.startPos) return;

		const dx = touch.clientX - this.startPos.x;
		const dy = touch.clientY - this.startPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		const cappedDistance = Math.min(distance, this.maxDistance);
		const angle = Math.atan2(dy, dx);

		this.currentPos.set({
			x: Math.cos(angle) * cappedDistance,
			y: Math.sin(angle) * cappedDistance,
		});

		// Track total movement for tap detection
		this.moveDistance = Math.max(this.moveDistance, distance);

		// Normalize movement for the game
		const pos = this.currentPos.get();
		const moveX = (pos.x / this.maxDistance) * this.options.speed;
		const moveY = (pos.y / this.maxDistance) * this.options.speed;

		if (typeof (/** @type {any} */ (this.host).handleMove) === "function") {
			/** @type {any} */ (this.host).handleMove(moveX, moveY);
		}

		this.host.requestUpdate();
	}

	/**
	 * End touch
	 */
	handleEnd() {
		// If it was a tap (minimal movement), trigger interact
		if (this.moveDistance < this.maxTapDistance) {
			this.handleInteractTap();
		}
		this.#stopMovement();
	}

	/**
	 * Handle interaction tap
	 */
	handleInteractTap() {
		if (typeof (/** @type {any} */ (this.host).handleInteract) === "function") {
			/** @type {any} */ (this.host).handleInteract();
		}
	}

	#stopMovement() {
		this.isActive = false;
		this.startPos = null;
		this.currentPos.set({ x: 0, y: 0 });
		this.host.requestUpdate();
	}

	/**
	 * Renders the touch controls
	 * @returns {import('lit').TemplateResult | typeof nothing}
	 */
	render() {
		// Use a local variable to help the analyzer/human and avoid repeating this.touch
		const { x, y } = this.currentPos.get();

		return html`
			<div class="touch-controls">
				<div 
					class="joystick-base"
					@touchstart="${(/** @type {TouchEvent} */ e) => {
						const touch = e.touches[0];
						if (touch) this.handleStart(touch);
					}}"
					@touchmove="${(/** @type {TouchEvent} */ e) => {
						const touch = e.touches[0];
						if (touch) this.handleMove(touch);
					}}"
					@touchend="${() => this.handleEnd()}"
				>
					<div 
						class="joystick-thumb"
						style="transform: translate(${x}px, ${y}px)"
					></div>
				</div>
			</div>
		`;
	}
}
