import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import { SignalWatcher } from "@lit-labs/signals";
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
import "../victory-screen/victory-screen.js";
import { styles } from "./game-view.css.js";

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
 * GameView - Main game orchestrator component
 *
 * Responsible for:
 * - Setting up and coordinating game controllers (collision, zones, interaction, keyboard, voice)
 * - Managing game state through signals
 * - Handling player input and movement
 * - Rendering game viewport, dialogs, and UI overlays
 * - Coordinating game flow (pause, level transitions, completion)
 *
 * @element game-view
 * @property {GameState} gameState - Current game state
 * @property {import('../legacys-end-app/LegacysEndApp.js').LegacysEndApp} app - Reference to Main App for controller setup
 */
export class GameView extends SignalWatcher(LitElement) {
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

		// Controllers (initialized in connectedCallback)
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

		// Bind handlers
		this.#boundHandleDialogNext = this.#handleDialogNext.bind(this);
		this.#boundHandleDialogPrev = this.#handleDialogPrev.bind(this);
		this.#boundHandleAutoMove = this.#handleAutoMove.bind(this);
		this.#boundHandleMoveInput = this.#handleMoveInput.bind(this);
	}

	/** @type {() => void} */
	#boundHandleDialogNext;
	/** @type {() => void} */
	#boundHandleDialogPrev;
	/** @type {(data: any) => void} */
	#boundHandleAutoMove;
	/** @type {(data: any) => void} */
	#boundHandleMoveInput;

	connectedCallback() {
		super.connectedCallback();
		// Initialize controllers when component is connected and app is available
		if (this.app && !this._controllersInitialized) {
			this.#setupControllers();
			this._controllersInitialized = true;
		}

		// Subscribe to global events via eventBus
		if (this.app?.eventBus) {
			this.app.eventBus.on(EVENTS.UI.DIALOG_NEXT, this.#boundHandleDialogNext);
			this.app.eventBus.on(EVENTS.UI.DIALOG_PREV, this.#boundHandleDialogPrev);
			this.app.eventBus.on(EVENTS.UI.HERO_AUTO_MOVE, this.#boundHandleAutoMove);
			this.app.eventBus.on(
				EVENTS.UI.HERO_MOVE_INPUT,
				this.#boundHandleMoveInput,
			);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.app?.eventBus) {
			this.app.eventBus.off(EVENTS.UI.DIALOG_NEXT, this.#boundHandleDialogNext);
			this.app.eventBus.off(EVENTS.UI.DIALOG_PREV, this.#boundHandleDialogPrev);
			this.app.eventBus.off(
				EVENTS.UI.HERO_AUTO_MOVE,
				this.#boundHandleAutoMove,
			);
			this.app.eventBus.off(
				EVENTS.UI.HERO_MOVE_INPUT,
				this.#boundHandleMoveInput,
			);
		}
		this.stopAutoMove();
	}

	/**
	 * Updates component when properties change
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
	 * Setup game controllers using the application context
	 */
	#setupControllers() {
		const context = this.#getGameContext();

		this.#setupGameMechanics(context);
		// Update context with newly created controllers
		context.interaction = this.interaction || undefined;
		/** @type {any} */ (context).collision = this.collision;
		/** @type {any} */ (context).zones = this.zones;

		this.#setupInputHandlers(context);
		this.#setupGameFlow(context);
		this.#syncControllersToApp(context);
		this.#syncProvidersToControllers();
	}

	/**
	 * Setup fundamental game mechanics controllers
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#setupGameMechanics(context) {
		setupZones(this, context);
		setupCollision(this, context);
		setupService(this, context);
		setupCharacterContexts(this, context);
		setupInteraction(this, context);
	}

	/**
	 * Setup input handling controllers
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#setupInputHandlers(context) {
		this.#setupKeyboard(context);
		setupVoice(/** @type {any} */ (this), context);
	}

	/**
	 * Setup high-level game flow controllers
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#setupGameFlow(context) {
		setupGameService(context);
		setupGameController(this, context);
	}

	/**
	 * Sync controller references back to app for legacy compatibility
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#syncControllersToApp(context) {
		this.app.interaction = this.interaction;
		this.app.collision = this.collision;
		this.app.zones = this.zones;
		this.app.serviceController = context.serviceController;
		this.app.characterContexts = context.characterContexts;
		context.interaction = this.app.interaction;
	}

	/**
	 * Sync providers to service controllers
	 */
	#syncProvidersToControllers() {
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
	 * Creates game context from app services
	 * @returns {import('../../core/game-context.js').IGameContext}
	 */
	#getGameContext() {
		return {
			eventBus: this.app.eventBus,
			logger: this.app.logger,
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
			aiService: this.app.aiService,
			voiceSynthesisService: this.app.voiceSynthesisService,
		};
	}

	/**
	 * Setup keyboard controller
	 * @param {import('../../core/game-context.js').IGameContext} context
	 */
	#setupKeyboard(context) {
		this.keyboard = new KeyboardController(this, {
			...context,
			speed: 2.5,
		});
	}

	/**
	 * Handles hero movement
	 * @param {number} dx - Delta X movement
	 * @param {number} dy - Delta Y movement
	 * @param {boolean} [isAuto] - Whether this is auto-movement
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
	 * Handles interaction with game objects
	 */
	handleInteract() {
		const stateService = this.app?.gameState;
		const showDialog = stateService?.showDialog?.get();
		if (showDialog) return;

		if (this.app?.commandBus && this.interaction) {
			this.app.commandBus.execute(
				new InteractCommand({
					interactionController: this.interaction,
				}),
			);
		}
	}

	/**
	 * Moves hero to target position with smooth animation
	 * @param {number} targetX - Target X position
	 * @param {number} targetY - Target Y position
	 * @param {number} [step] - Movement step size
	 */
	moveTo(targetX, targetY, step = 0.4) {
		this.stopAutoMove();

		const move = () => {
			const heroPos = this.app.gameState.heroPos.get();
			const { x, y } = heroPos;

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
	 * Stops auto-movement animation
	 */
	stopAutoMove() {
		if (this._autoMoveRequestId) {
			cancelAnimationFrame(this._autoMoveRequestId);
			this._autoMoveRequestId = null;
		}
	}

	/**
	 * Triggers level transition to next chapter
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
	 * Handles level completion
	 */
	handleLevelComplete() {
		this.app.eventBus.emit(EVENTS.UI.LEVEL_COMPLETED);
	}

	/**
	 * Toggles game pause state
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

	/**
	 * Handles dialog next navigation
	 */
	#handleDialogNext() {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.nextSlide();
	}

	/**
	 * Handles dialog previous navigation
	 */
	#handleDialogPrev() {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.prevSlide();
	}

	/**
	 * Handles slide change events from level dialog
	 * @param {CustomEvent} e - Slide changed event
	 */
	#handleSlideChanged(e) {
		if (this.app?.gameState) {
			this.app.gameState.setCurrentDialogText(e.detail.text);
		}
	}

	/**
	 * Handles auto-move events
	 * @param {{x: number, y: number}} data - Target position
	 */
	#handleAutoMove(data) {
		const { x, y } = data;
		this.moveTo(x, y);
	}

	/**
	 * Handles move input events
	 * @param {{dx: number, dy: number}} data - Movement delta
	 */
	#handleMoveInput(data) {
		const { dx, dy } = data;
		this.handleMove(dx, dy);
	}

	render() {
		const { config, quest } = this.gameState || {};
		const stateService = this.app?.gameState;

		if (!config || !stateService || !stateService.isPaused) {
			return html`<div>Loading level data...</div>`;
		}

		// Pull current state from signals for rendering
		const isPaused = stateService.isPaused.get();
		const isQuestCompleted = stateService.isQuestCompleted.get();
		const showDialog = stateService.showDialog.get();

		return html`
			<pause-menu
				.open="${isPaused}"
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
				isQuestCompleted
					? html`
					<victory-screen
						.quest="${quest?.data}" 
						.onReturn="${() => this.dispatchEvent(new CustomEvent("return-to-hub"))}"
					></victory-screen>
				`
					: html`
				<main 
					@toggle-voice="${() => this.voice?.toggle()}"
				>
					<game-viewport
						.gameState="${this.gameState}"
						.app="${this.app}"
						.isVoiceActive="${this.voice?.enabled || false}"
					></game-viewport>
				</main>
			`
			}

			${
				showDialog && !isQuestCompleted
					? html`
				<level-dialog
					.config="${config}"
					.level="${quest?.levelId || ""}"
					@complete="${() => this.handleLevelComplete()}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
					@slide-changed="${(/** @type {any} */ e) => this.#handleSlideChanged(e)}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	static styles = styles;
}
