import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import { html, LitElement } from "lit";
import { KeyboardController } from "../../controllers/keyboard-controller.js";
import { setupCharacterContexts } from "../../setup/setup-character-contexts.js";
import { setupCollision } from "../../setup/setup-collision.js";
import { setupGameController } from "../../setup/setup-game.js";
import { setupInteraction } from "../../setup/setup-interaction.js";
import { setupService } from "../../setup/setup-service.js";
import { setupVoice } from "../../setup/setup-voice.js";
import { setupZones } from "../../setup/setup-zones.js";
import "../game-viewport.js";
import "../hero-profile.js";
import "../level-dialog.js";
import "../npc-element.js";
import "../pause-menu.js";
import "../reward-element.js";
import { styles } from "./game-view.css.js";
import "./victory-screen.js";

/**
 * @typedef {import('../../utils/game-state-mapper.js').GameState} GameState
 */

/**
 * @element game-view
 * @property {GameState} gameState
 * @property {import('../../legacys-end-app.js').LegacysEndApp} app - Reference to Main App for controller setup (temporary, will be removed)
 * @property {import('../../controllers/collision-controller.js').CollisionController} collision
 * @property {import('../../controllers/game-zone-controller.js').GameZoneController} zones
 * @property {import('../../controllers/interaction-controller.js').InteractionController} interaction
 * @property {import('../../controllers/keyboard-controller.js').KeyboardController} keyboard
 * @property {import('../../controllers/voice-controller.js').VoiceController} voice
 * @property {import('../../controllers/game-controller.js').GameController} gameController
 */
export class GameView extends LitElement {
	static properties = {
		gameState: { type: Object },
		app: { type: Object },
	};

	constructor() {
		super();
		/** @type {GameState} */
		this.gameState = /** @type {GameState} */ ({});
		/** @type {any} */
		this.app = null;
		this._controllersInitialized = false;
		this._autoMoveRequestId = null;
		/** @type {import('../../controllers/collision-controller.js').CollisionController | null} */
		this.collision = null;
		/** @type {import('../../controllers/game-zone-controller.js').GameZoneController | null} */
		this.zones = null;
		/** @type {import('../../controllers/interaction-controller.js').InteractionController | null} */
		this.interaction = null;
		/** @type {import('../../controllers/keyboard-controller.js').KeyboardController | null} */
		this.keyboard = null;
		/** @type {import('../../controllers/voice-controller.js').VoiceController | null} */
		this.voice = null;
		/** @type {import('../../controllers/game-controller.js').GameController | null} */
		this.gameController = null;
	}

	connectedCallback() {
		super.connectedCallback();
		// Initialize controllers when component is connected and app is available
		if (this.app && !this._controllersInitialized) {
			this.#setupControllers();
			this._controllersInitialized = true;
		}
	}

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 */
	updated(changedProperties) {
		super.updated(changedProperties);
		// Initialize controllers if app becomes available after initial render
		if (
			changedProperties.has("app") &&
			this.app &&
			!this._controllersInitialized
		) {
			this.#setupControllers();
			this._controllersInitialized = true;
		}
	}

	/**
	 * Setup game controllers
	 */
	#setupControllers() {
		// Initialize keyboard controller (now internal to GameView)
		this.#setupKeyboard();

		// Initialize remaining controllers (still using app)
		setupGameController(this, this.app);
		setupVoice(/** @type {any} */ (this), this.app);

		// Initialize game mechanics controllers
		setupZones(this, this.app);
		setupCollision(this, this.app);
		setupService(this.app); // ServiceController remains global-ish? Check setup-service.

		// Initialize context and interaction
		setupCharacterContexts(this.app); // CharacterContexts might be global?
		setupInteraction(this, this.app);

		// After controllers are initialized, assign providers and load data
		if (this.app.serviceController) {
			this.app.serviceController.options.profileProvider =
				this.app.profileProvider;
			this.app.serviceController.loadUserData();
		}
		if (this.app.characterContexts) {
			this.app.characterContexts.options.suitProvider = this.app.suitProvider;
			this.app.characterContexts.options.gearProvider = this.app.gearProvider;
			this.app.characterContexts.options.powerProvider = this.app.powerProvider;
			this.app.characterContexts.options.masteryProvider =
				this.app.masteryProvider;
		}
	}

	/**
	 * Setup keyboard controller (internal to GameView)
	 */
	#setupKeyboard() {
		this.keyboard = new KeyboardController(this, {
			speed: 2.5,
			onMove: (dx, dy) => this.handleMove(dx, dy),
			onInteract: () => this.handleInteract(),
			onPause: () => this.togglePause(),
		});
	}

	/**
	 * Handle keyboard/voice movement input
	 * @param {number} dx
	 * @param {number} dy
	 * @param {boolean} [isAuto]
	 */
	handleMove(dx, dy, isAuto = false) {
		if (!isAuto) {
			this.stopAutoMove();
		}

		const currentConfig = this.app.questController?.currentChapter;
		if (!currentConfig) return;

		const state = this.app.gameState.getState();
		let { x, y } = state.heroPos;

		x += dx;
		y += dy;

		// Clamp to boundaries
		x = Math.max(2, Math.min(98, x));
		y = Math.max(2, Math.min(98, y));

		// Check Exit Collision
		if (this.app.questController?.hasExitZone() && this.collision) {
			this.collision.checkExitZone(
				x,
				y,
				currentConfig.exitZone,
				state.hasCollectedItem,
			);
		}

		this.app.gameState.setHeroPosition(x, y);
		this.zones?.checkZones(x, y);
	}

	/**
	 * Handle interaction (talk to NPC, etc.)
	 */
	handleInteract() {
		this.interaction?.handleInteract();
	}

	/**
	 * Auto-move hero to target position
	 * @param {number} targetX
	 * @param {number} targetY
	 * @param {number} [step]
	 */
	moveTo(targetX, targetY, step = 0.4) {
		this.stopAutoMove();

		const move = () => {
			const state = this.app.gameState.getState();
			const { x, y } = state.heroPos;

			const dx = targetX - x;
			const dy = targetY - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < step) {
				this.app.gameState.setHeroPosition(targetX, targetY);
				this.stopAutoMove();
				return;
			}

			const moveX = (dx / distance) * step;
			const moveY = (dy / distance) * step;

			this.handleMove(moveX, moveY, true);
			this._autoMoveRequestId = requestAnimationFrame(move);
		};

		this._autoMoveRequestId = requestAnimationFrame(move);
	}

	/**
	 * Stop auto-movement
	 */
	stopAutoMove() {
		if (this._autoMoveRequestId) {
			cancelAnimationFrame(this._autoMoveRequestId);
			this._autoMoveRequestId = null;
		}
	}

	/**
	 * Trigger level transition (evolution animation + chapter completion)
	 */
	triggerLevelTransition() {
		this.stopAutoMove();
		if (this.app.questController?.isInQuest()) {
			this.app.gameState.setEvolving(true);
			setTimeout(() => {
				this.app.questController.completeChapter();
				this.app.gameState.setEvolving(false);
			}, 500);
		}
	}

	/**
	 * Handle level completion
	 */
	handleLevelComplete() {
		this.app.showDialog = false;

		// If we were showing the next chapter dialog (after reward collection),
		// advance to the next chapter
		if (
			this.app.isRewardCollected &&
			this.app.questController?.hasNextChapter()
		) {
			console.log("📖 Advancing to next chapter after preview");
			this.triggerLevelTransition();
		} else {
			// Otherwise, just mark item as collected (initial dialog completion)
			this.app.gameState.setCollectedItem(true);
		}
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		// Toggle pause state directly in gameState
		const currentState = this.gameState?.ui?.isPaused ?? false;
		if (this.app?.gameState) {
			this.app.gameState.setPaused(!currentState);
		}
	}

	render() {
		const { config, ui, quest } = this.gameState || {};

		if (!config) {
			return html`<div>Loading level data...</div>`;
		}

		// Dialog Config Logic
		const dialogConfig = config;

		return html`

			<pause-menu
				.open="${ui?.isPaused}"
				@resume="${() => {
					this.app.gameState.setPaused(false);
					this.dispatchEvent(new CustomEvent("resume"));
				}}"
				@restart="${() => {
					this.app.gameState.setPaused(false);
					this.dispatchEvent(new CustomEvent("restart"));
				}}"
				@quit="${() => {
					this.app.gameState.setPaused(false);
					this.dispatchEvent(new CustomEvent("quit"));
				}}"
			></pause-menu>

			${
				ui?.isQuestCompleted
					? html`
					<victory-screen
						.quest="${quest?.data /* Need to ensure quest data is available */}" 
						.onReturn="${() => this.dispatchEvent(new CustomEvent("return-to-hub"))}"
					></victory-screen>
				`
					: html`
				<main>
					<game-viewport
						.gameState="${this.gameState}"
					></game-viewport>
				</main>
				`
			}

			${
				ui?.showDialog && !ui?.isQuestCompleted
					? html`
				<level-dialog
					.config="${dialogConfig}"
					.level="${quest?.levelId}"
					@complete="${() => this.handleLevelComplete()}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	static styles = styles;
}

customElements.define("game-view", GameView);
