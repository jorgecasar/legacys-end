/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('../commands/command-bus.js').CommandBus} CommandBus
 */

import { InteractCommand } from "../commands/interact-command.js";
import { PauseGameCommand } from "../commands/pause-game-command.js";
import { GameEvents } from "../core/event-bus.js";

/**
 * @typedef {Object} KeyboardOptions
 * @property {number} [speed] - Movement speed multiplier (default: 2.5)
 */

/**
 * KeyboardController - Lit Reactive Controller for keyboard input
 *
 * Handles:
 * - Movement keys (WASD, Arrow keys) -> HERO_MOVE_INPUT
 * - Interaction key (Space) -> InteractCommand
 * - Pause key (Escape) -> PauseGameCommand
 * - Undo/Redo (Ctrl+Z/Y) -> CommandBus
 *
 * @implements {ReactiveController}
 */
export class KeyboardController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<KeyboardOptions & import('../core/game-context.js').IGameContext & {interaction: any}>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {KeyboardOptions & {interaction: any, commandBus: import('../commands/command-bus.js').CommandBus|undefined, eventBus: any, gameState: any, worldState: import('../game/interfaces.js').IWorldStateService|undefined}} */
		this.options = {
			speed: 2.5,
			interaction: undefined,
			commandBus: undefined,
			eventBus: undefined,
			gameState: undefined,
			worldState: undefined,
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
		const { commandBus, interaction } = this.options;

		// Handle Undo/Redo (Ctrl+Z / Ctrl+Y or Shift+Ctrl+Z)
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
			e.preventDefault();
			if (e.shiftKey) {
				commandBus?.redo();
			} else {
				commandBus?.undo();
			}
			return;
		}

		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
			e.preventDefault();
			commandBus?.redo();
			return;
		}

		// Handle Pause (Escape) - Always allowed
		if (e.code === "Escape") {
			e.preventDefault();
			const { worldState } = this.options;
			if (commandBus && worldState) {
				commandBus.execute(new PauseGameCommand({ worldState }));
			}
			return;
		}

		// Handle interaction (Space)
		if (e.code === "Space") {
			e.preventDefault();
			const effectiveInteraction =
				/** @type {any} */ (this.host).interaction || interaction;

			if (commandBus && effectiveInteraction) {
				commandBus.execute(
					new InteractCommand({
						interactionController: effectiveInteraction,
					}),
				);
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
			if (this.options.eventBus) {
				this.options.eventBus.emit(GameEvents.HERO_MOVE_INPUT, {
					dx: moveX,
					dy: moveY,
				});
			}
		}
	}
}
