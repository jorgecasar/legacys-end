import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import { html, LitElement } from "lit";
import { AdvanceChapterCommand } from "../../commands/advance-chapter-command.js";
import { InteractCommand } from "../../commands/interact-command.js";
import { MoveHeroCommand } from "../../commands/move-hero-command.js";
import { PauseGameCommand } from "../../commands/pause-game-command.js";
import { EVENTS } from "../../constants/events.js";
import { KeyboardController } from "../../controllers/keyboard-controller.js";
import { setupCharacterContexts } from "../../setup/setup-character-contexts.js";
import { setupCollision } from "../../setup/setup-collision.js";
import {
	setupGameController,
	setupGameService,
} from "../../setup/setup-game.js";
import { setupInteraction } from "../../setup/setup-interaction.js";
import { setupService } from "../../setup/setup-service.js";
import { setupVoice } from "../../setup/setup-voice.js";
import { setupZones } from "../../setup/setup-zones.js";
import "../game-viewport/game-viewport.js";
import "../hero-profile/hero-profile.js";
import "../level-dialog/level-dialog.js";
import "../npc-element/npc-element.js";
import "../pause-menu/pause-menu.js";
import "../reward-element/reward-element.js";
import { styles } from "./game-view.css.js";
import "../victory-screen/victory-screen.js";

/**
 * @typedef {Object} GameState
 * @property {import('../../services/game-state-service.js').ThemeMode} [themeMode]
 * @property {import('../../config/game-configuration.js').GameplayConfig} config
 * @property {Object} ui
 * @property {boolean} ui.isPaused
 * @property {boolean} ui.showDialog
 * @property {boolean} ui.isQuestCompleted
 * @property {string} ui.lockedMessage
 * @property {Object} quest
 * @property {import('../../services/quest-registry-service.js').Quest|null} quest.data
 * @property {number} quest.chapterNumber
 * @property {number} quest.totalChapters
 * @property {boolean} quest.isLastChapter
 * @property {string} [quest.levelId]
 * @property {Object} hero
 * @property {import('../../services/game-state-service.js').HeroPosition} hero.pos
 * @property {boolean} hero.isEvolving
 * @property {import('../../services/game-state-service.js').HotSwitchState} hero.hotSwitchState
 * @property {Object} levelState
 * @property {boolean} levelState.hasCollectedItem
 * @property {boolean} levelState.isRewardCollected
 * @property {boolean} levelState.isCloseToTarget
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

		// Subscribe to dialog events
		if (this.app?.eventBus) {
			this.app.eventBus.on(EVENTS.UI.DIALOG_NEXT, this.handleDialogNext);
			this.app.eventBus.on(EVENTS.UI.DIALOG_PREV, this.handleDialogPrev);
			this.app.eventBus.on(EVENTS.UI.HERO_AUTO_MOVE, this.handleAutoMove);
			this.app.eventBus.on(EVENTS.UI.HERO_MOVE_INPUT, this.handleMoveInput);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.app?.eventBus) {
			this.app.eventBus.off(EVENTS.UI.DIALOG_NEXT, this.handleDialogNext);
			this.app.eventBus.off(EVENTS.UI.DIALOG_PREV, this.handleDialogPrev);
			this.app.eventBus.off(EVENTS.UI.HERO_AUTO_MOVE, this.handleAutoMove);
			this.app.eventBus.off(EVENTS.UI.HERO_MOVE_INPUT, this.handleMoveInput);
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
		const context = this.#getGameContext();

		// Initialize game mechanics controllers first
		setupZones(this, context);
		setupCollision(this, context);
		setupService(this, context);
		setupCharacterContexts(this, context);

		// Setup Interaction - CRITICAL: Must be before Voice/Keyboard execution context usage
		setupInteraction(this, context);

		// Update app refs immediately so updated context has them
		this.app.interaction = this.interaction;
		this.app.collision = this.collision;
		this.app.zones = this.zones;
		this.app.serviceController = context.serviceController;
		this.app.characterContexts = context.characterContexts;

		// Re-create context with valid references if needed, or mutate it
		// Since context is passed by reference, we can mutate it here to ensure downstream consumers get it
		context.interaction = this.app.interaction;

		// Initialize input controllers (Voice/Keyboard) that depend on Interaction
		this.#setupKeyboard(context);
		setupVoice(/** @type {any} */ (this), context);

		// Initialize remaining controllers using context
		setupGameService(context);
		setupGameController(this, context);
		this.app.characterContexts = context.characterContexts;

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
	 * Create game context for dependency injection
	 * @returns {import('../../core/game-context.js').IGameContext}
	 */
	#getGameContext() {
		return {
			eventBus: this.app.eventBus,
			gameState: this.app.gameState,
			commandBus: this.app.commandBus,
			sessionManager: this.app.sessionManager,
			questController: this.app.questController,
			progressService: this.app.progressService,
			gameService: this.app.gameService,
			router: this.app.router,
			serviceController: this.app.serviceController,
			characterContexts: this.app.characterContexts,
			interaction: this.app.interaction,
		};
	}

	/**
	 * Setup keyboard controller (internal to GameView)
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#setupKeyboard(context) {
		this.keyboard = new KeyboardController(this, context, {
			speed: 2.5,
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

		if (this.app?.commandBus) {
			this.app.commandBus.execute(
				new MoveHeroCommand({
					gameState: this.app.gameState,
					eventBus: this.app.eventBus,
					dx,
					dy,
				}),
			);
		}
	}

	/**
	 * Handle interaction (talk to NPC, etc.)
	 */
	handleInteract() {
		if (this.gameState?.ui?.showDialog) return;

		if (this.app?.commandBus && this.interaction) {
			this.app.commandBus.execute(
				new InteractCommand({
					interactionController: this.interaction,
				}),
			);
		}
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
		if (this.app?.commandBus) {
			this.app.commandBus.execute(
				new AdvanceChapterCommand({
					gameState: this.app.gameState,
					questController: this.app.questController,
				}),
			);
		}
	}

	/**
	 * Handle level completion
	 */
	handleLevelComplete() {
		// Decoupled logic: GameView only reports the event.
		// Controller handles state updates and transition logic.
		this.app.eventBus.emit(EVENTS.UI.LEVEL_COMPLETED);
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		if (this.app?.commandBus) {
			this.app.commandBus.execute(
				new PauseGameCommand({
					gameState: this.app.gameState,
				}),
			);
		}
	}

	handleDialogNext = () => {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.nextSlide();
	};

	handleDialogPrev = () => {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.prevSlide();
	};

	/**
	 * @param {CustomEvent} e
	 */
	handleSlideChanged = (e) => {
		if (this.app?.gameState) {
			this.app.gameState.setCurrentDialogText(e.detail.text);
		}
	};

	/**
	 * @param {{x: number, y: number}} data
	 */
	handleAutoMove = (data) => {
		const { x, y } = data;
		this.moveTo(x, y);
	};

	/**
	 * @param {{dx: number, dy: number}} data
	 */
	handleMoveInput = (data) => {
		const { dx, dy } = data;
		this.handleMove(dx, dy);
	};

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
				<main 
					@toggle-voice="${() => this.voice?.toggle()}"
				>
					<game-viewport
						.gameState="${this.gameState}"
						.isVoiceActive="${this.voice?.enabled || false}"
					></game-viewport>
				</main>
				`
			}

			${
				ui?.showDialog && !ui?.isQuestCompleted
					? html`
				<level-dialog
					.config="${dialogConfig}"
					.level="${quest?.levelId || ""}"
					@complete="${() => this.handleLevelComplete()}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
					@slide-changed="${this.handleSlideChanged}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	static styles = styles;
}

customElements.define("game-view", GameView);
