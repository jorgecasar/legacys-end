import { Signal } from "@lit-labs/signals";
import { css, html, nothing } from "lit";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost
 */

/**
 * @typedef {Object} TouchOptions
 * @property {number} [speed] - Movement speed multiplier (default: 1.2)
 */

/**
 * @typedef {Object} HostWithCallbacks
 * @property {(dx: number, dy: number) => void} [handleMove] - Movement callback
 * @property {() => void} [handleInteract] - Interaction callback
 * @property {() => void} [handlePause] - Pause callback
 */

export const touchStyles = css`
	/* Mobile/Touch Controls */
	.touch-controls {
		display: none;
		width: 100%;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
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

	.touch-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		pointer-events: auto;
	}

	.touch-btn {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border: 2px solid rgba(255, 255, 255, 0.25);
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		box-shadow: var(--wa-shadow-large);
		cursor: pointer;
		touch-action: none;
	}

	.touch-btn:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
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

		.touch-btn {
			width: 50px;
			height: 50px;
		}
	}
`;

/**
 * TouchController - Lit Reactive Controller for mobile touch input
 *
 * Handles:
 * - Virtual joystick for movement -> host.handleMove(dx, dy)
 * - Tap to interact -> host.handleInteract()
 * - Pause button -> host.handlePause()
 *
 * @implements {ReactiveController}
 */
export class TouchController {
	/** @type {boolean} */
	#isActive = false;
	/** @type {{x: number, y: number} | null} */
	#startPos = null;
	/** @type {Signal.State<{x: number, y: number}>} */
	#currentPos = new Signal.State({ x: 0, y: 0 });
	/** @type {number} */
	#maxDistance = 50; // Max radius for the joystick
	/** @type {number} */
	#maxTapDistance = 10; // Max distance for a tap
	/** @type {number} */
	#moveDistance = 0;

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {Partial<TouchOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {ReactiveControllerHost} */
		this.host = host;
		this.options = {
			speed: 1.2,
			...options,
		};

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
	#handleStart(touch) {
		this.#isActive = true;
		this.#startPos = { x: touch.clientX, y: touch.clientY };
		this.#currentPos.set({ x: 0, y: 0 });
		this.#moveDistance = 0;
		this.host.requestUpdate();
	}

	/**
	 * Handle touch move
	 * @param {Touch} touch
	 */
	#handleMove(touch) {
		if (!this.#isActive || !this.#startPos) return;

		const dx = touch.clientX - this.#startPos.x;
		const dy = touch.clientY - this.#startPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		const cappedDistance = Math.min(distance, this.#maxDistance);
		const angle = Math.atan2(dy, dx);

		this.#currentPos.set({
			x: Math.cos(angle) * cappedDistance,
			y: Math.sin(angle) * cappedDistance,
		});

		// Track total movement for tap detection
		this.#moveDistance = Math.max(this.#moveDistance, distance);

		// Normalize movement for the game
		const pos = this.#currentPos.get();
		const moveX = (pos.x / this.#maxDistance) * this.options.speed;
		const moveY = (pos.y / this.#maxDistance) * this.options.speed;

		this.#callHostMethod("handleMove", moveX, moveY);

		this.host.requestUpdate();
	}

	/**
	 * End touch
	 */
	#handleEnd() {
		// If it was a tap (minimal movement), trigger interact
		if (this.#moveDistance < this.#maxTapDistance) {
			this.#handleInteractTap();
		}
		this.#stopMovement();
	}

	/**
	 * Handle interaction tap
	 */
	#handleInteractTap() {
		this.#callHostMethod("handleInteract");
	}

	/**
	 * Handle pause tap
	 */
	#handlePauseTap() {
		this.#callHostMethod("handlePause");
	}

	#stopMovement() {
		this.#isActive = false;
		this.#startPos = null;
		this.#currentPos.set({ x: 0, y: 0 });
		this.host.requestUpdate();
	}

	/**
	 * Safely call a method on the host if it exists
	 * @param {keyof HostWithCallbacks} methodName
	 * @param {...any} args
	 */
	#callHostMethod(methodName, ...args) {
		const host = /** @type {HostWithCallbacks} */ (
			/** @type {unknown} */ (this.host)
		);
		if (typeof host[methodName] === "function") {
			/** @type {Function} */ (host[methodName])(...args);
		}
	}

	/**
	 * Renders the touch controls
	 * @returns {import('lit').TemplateResult | typeof nothing}
	 */
	render() {
		// Use a local variable to help the analyzer/human and avoid repeating this.touch
		const { x, y } = this.#currentPos.get();

		return html`
			<div class="touch-controls">
				<div class="touch-actions">
					<div class="touch-btn pause-btn" @click="${() => this.#handlePauseTap()}">
						<wa-icon name="pause"></wa-icon>
					</div>
				</div>

				<div 
					class="joystick-base"
					@touchstart="${(/** @type {TouchEvent} */ e) => {
						const touch = e.touches[0];
						if (touch) this.#handleStart(touch);
					}}"
					@touchmove="${(/** @type {TouchEvent} */ e) => {
						const touch = e.touches[0];
						if (touch) this.#handleMove(touch);
					}}"
					@touchend="${() => this.#handleEnd()}"
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
