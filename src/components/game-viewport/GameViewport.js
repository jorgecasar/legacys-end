import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import { ContextProvider } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { AdvanceChapterCommand } from "../../commands/advance-chapter-command.js";
import { InteractCommand } from "../../commands/interact-command.js";
import { MoveHeroCommand } from "../../commands/move-hero-command.js";
import { PauseGameCommand } from "../../commands/pause-game-command.js";
import { gameConfig } from "../../config/game-configuration.js";
import { KeyboardController } from "../../controllers/keyboard-controller.js";
import { GameEvents } from "../../core/event-bus.js";
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
import {
	extractAssetPath,
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import "../game-hud/game-hud.js";
import "../hero-profile/hero-profile.js";
import "../npc-element/npc-element.js";
import "../reward-element/reward-element.js";
import "../viewport-elements/game-controls/game-controls.js";
import "../viewport-elements/game-exit-zone/game-exit-zone.js";
import "../viewport-elements/game-zone-indicator/game-zone-indicator.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { HeroStateService } from "../../game/services/hero-state-service.js";
import { QuestStateService } from "../../game/services/quest-state-service.js";
import { WorldStateService } from "../../game/services/world-state-service.js";
import { gameViewportStyles } from "./GameViewport.styles.js";

/**
 * @element game-viewport
 * @property {any} gameState - Configuration derived state
 * @property {import('../legacys-end-app/LegacysEndApp.js').LegacysEndApp} app - Reference to Main App for direct signal access
 */
export class GameViewport extends SignalWatcher(LitElement) {
	static properties = {
		gameState: { type: Object },
		app: { type: Object },
		isAnimatingReward: { state: true },
		rewardAnimState: { state: true },
		isRewardCollected: { state: true },
		isVoiceActive: { type: Boolean },
	};

	static styles = gameViewportStyles;

	constructor() {
		super();
		this.gameState = {};
		/** @type {any} */
		this.app = null;
		this.isAnimatingReward = false;
		this.rewardAnimState = "";
		this.isRewardCollected = false;
		this.isVoiceActive = false;

		// Controllers
		this._controllersInitialized = false;
		this._eventsSubscribed = false;
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

		// Domain Services
		this.heroState = new HeroStateService();
		this.questState = new QuestStateService();
		this.worldState = new WorldStateService();

		// Context Providers
		this.heroStateProvider = new ContextProvider(this, {
			context: heroStateContext,
			initialValue: this.heroState,
		});
		this.questStateProvider = new ContextProvider(this, {
			context: questStateContext,
			initialValue: this.questState,
		});
		this.worldStateProvider = new ContextProvider(this, {
			context: worldStateContext,
			initialValue: this.worldState,
		});

		this.#boundHandleMoveInput = this.#handleMoveInput.bind(this);
	}

	/** @type {(data: any) => void} */
	#boundHandleMoveInput;

	/**
	 * @param {import("lit").PropertyValues} changedProperties
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
			// Subscribe to events now that app is available
			this.#subscribeToEvents();
		}

		// Sync Hero Image from current chapter config
		const config = /** @type {any} */ (this.gameState)?.config;
		if (config) {
			const isRewardCollected = this.questState.isRewardCollected.get();
			const heroImage =
				isRewardCollected && config.hero?.reward
					? config.hero.reward
					: config.hero?.image;
			this.heroState.setImageSrc(heroImage || "");
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#unsubscribeFromEvents();
		this.stopAutoMove();
	}

	/**
	 * Subscribe to event bus events
	 */
	#subscribeToEvents() {
		if (this.app?.eventBus && !this._eventsSubscribed) {
			this.app.eventBus.on(
				GameEvents.HERO_MOVE_INPUT,
				this.#boundHandleMoveInput,
			);
			this._eventsSubscribed = true;
		}
	}

	/**
	 * Unsubscribe from event bus events
	 */
	#unsubscribeFromEvents() {
		if (this.app?.eventBus && this._eventsSubscribed) {
			this.app.eventBus.off(
				GameEvents.HERO_MOVE_INPUT,
				this.#boundHandleMoveInput,
			);
			this._eventsSubscribed = false;
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

		// Link domain services if not already
		if (this.app.heroState) {
			this.heroState = this.app.heroState;
			this.heroStateProvider.setValue(this.heroState);
		}
		if (this.app.questState) {
			this.questState = this.app.questState;
			this.questStateProvider.setValue(this.questState);
		}
		if (this.app.worldState) {
			this.worldState = this.app.worldState;
			this.worldStateProvider.setValue(this.worldState);
		}
	}

	/**
	 * Sync providers to service controllers
	 */
	#syncProvidersToControllers() {
		if (this.app.serviceController) {
			this.app.serviceController.options.profileProvider =
				this.app.profileProvider;
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
			questController: this.app.questController,
			progressService: this.app.progressService,
			router: this.app.router,
			serviceController: this.app.serviceController,
			characterContexts: this.app.characterContexts,
			interaction: this.app.interaction,
			aiService: this.app.aiService,
			voiceSynthesisService: this.app.voiceSynthesisService,
			sessionService: this.app.sessionService,
			questLoader: this.app.questLoader,
			heroState: this.app.heroState,
			questState: this.app.questState,
			worldState: this.app.worldState,
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
					heroState: this.heroState,
					worldState: this.app.worldState,
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
		const showDialog = this.worldState?.showDialog?.get();
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
			const heroPos = this.heroState.pos.get();
			const { x, y } = heroPos;

			const dx = targetX - x;
			const dy = targetY - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < step) {
				this.heroState.setPos(targetX, targetY);
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
					heroState: this.heroState,
					questLoader: this.app.questLoader,
				}),
			);
		}
	}

	/**
	 * Handles level completion
	 */
	handleLevelComplete() {
		if (this.gameController) {
			this.gameController.handleLevelCompleted();
		}
	}

	/**
	 * Toggles game pause state
	 */
	togglePause() {
		if (this.app?.commandBus) {
			this.app.commandBus.execute(
				new PauseGameCommand({
					worldState: this.worldState,
				}),
			);
		}
	}

	/**
	 * Advances to the next dialog slide
	 */
	nextDialogSlide() {
		// Dialog is not in GameViewport yet, need to manage this or event
		this.dispatchEvent(new CustomEvent("next-slide"));
	}

	/**
	 * Returns to the previous dialog slide
	 */
	prevDialogSlide() {
		this.dispatchEvent(new CustomEvent("prev-slide"));
	}

	/**
	 * Handles move input events
	 * @param {{dx: number, dy: number}} data - Movement delta
	 */
	#handleMoveInput(data) {
		const { dx, dy } = data;
		this.handleMove(dx, dy);
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		// Handle reward collection animation trigger via signal observation
		if (this.questState) {
			const hasCollectedItem = this.questState.hasCollectedItem.get();
			const prevHasCollectedItem = changedProperties.has("app")
				? false
				: this._lastHasCollectedItem;

			if (!prevHasCollectedItem && hasCollectedItem) {
				this.startRewardAnimation();
			} else if (!hasCollectedItem) {
				this.isRewardCollected = false;
			}
			this._lastHasCollectedItem = hasCollectedItem;
		}
	}

	startRewardAnimation() {
		this.isAnimatingReward = true;
		this.rewardAnimState = "start";

		// Step 1: Grow to center
		setTimeout(() => {
			this.rewardAnimState = "growing";
			this.requestUpdate();
		}, 50);

		// Step 2: Move to hero
		setTimeout(() => {
			this.rewardAnimState = "moving";
			this.requestUpdate();
		}, gameConfig.animation.rewardDuration / 2);

		// Step 3: End
		setTimeout(() => {
			this.isAnimatingReward = false;
			this.rewardAnimState = "";
			this.isRewardCollected = true;
			this.dispatchEvent(
				new CustomEvent("reward-collected", {
					bubbles: true,
					composed: true,
				}),
			);
			this.requestUpdate();
		}, gameConfig.animation.rewardDuration);
	}

	render() {
		const config = /** @type {any} */ (this.gameState)?.config || {};
		const backgroundStyle = config.backgroundStyle || "";
		const backgroundPath = extractAssetPath(backgroundStyle);

		const hotSwitchState = this.heroState.hotSwitchState.get();
		const themeMode = this.app?.themeService?.themeMode.get() || "light";
		const hasCollectedItem = this.questState.hasCollectedItem.get();
		return html`
			<game-hud
				.currentChapterNumber="${this.app?.questController?.getCurrentChapterNumber()}"
				.totalChapters="${this.app?.questController?.getTotalChapters()}"
				.levelTitle="${config?.title}"
				.questTitle="${this.app?.questController?.currentQuest?.name}"
			></game-hud>

			<div class="game-area">
				${
					backgroundPath
						? html`
					<img 
						src="${ifDefined(processImagePath(backgroundPath))}"
						srcset="${ifDefined(processImageSrcset(backgroundPath))}"
						sizes="min(100vw, calc(100vh - 96px))"
						class="game-area-bg"
						alt="Background"
					/>
				`
						: ""
				}
				<game-controls 
					.isVoiceActive="${this.voice?.enabled || false}"
					@toggle-voice="${this.#handleToggleVoice}"
				></game-controls>
				
				<game-zone-indicator
					.type="${"THEME_CHANGE"}"
					.zones="${config?.zones || []}"
					.currentState="${themeMode}"
				></game-zone-indicator>

				<game-zone-indicator
					.type="${"CONTEXT_CHANGE"}"
					.zones="${config?.zones || []}"
					.currentState="${hotSwitchState || ""}"
				></game-zone-indicator>

				<game-exit-zone 
					.zoneConfig="${config?.exitZone || {}}" 
					.active="${hasCollectedItem}"
				></game-exit-zone>

				${
					this.questState.lockedMessage.get()
						? html`<div class="locked-message">${this.questState.lockedMessage.get()}</div>`
						: ""
				}



				${this._renderNPC()}
				${this._renderReward()}
				${this._renderHero()}
			</div>
		`;
	}

	_renderNPC() {
		const config = /** @type {any} */ (this.gameState)?.config;
		if (!config?.npc) return "";

		// Interaction controller state remains external for now
		const isCloseToTarget = this.app?.interaction?.isCloseToNpc() || false;

		return html`
			<npc-element
				.name="${config.npc.name}"
				.image="${config.npc.image}"
				.icon="${config.npc.icon || "user"}"
				.x="${config.npc.position.x}"
				.y="${config.npc.position.y}"
				.isClose="${isCloseToTarget}"
			></npc-element>
		`;
	}

	_renderReward() {
		const config = /** @type {any} */ (this.gameState)?.config;
		if (!config?.reward) return "";

		const hasCollectedItem = this.questState.hasCollectedItem.get();

		if (!this.isAnimatingReward && hasCollectedItem) {
			return "";
		}

		// Calculations for animation or static position
		let x = config.reward.position.x;
		let y = config.reward.position.y;

		if (this.isAnimatingReward) {
			if (this.rewardAnimState === "growing") {
				x = 50;
				y = 50;
			} else if (this.rewardAnimState === "moving") {
				const heroPos = this.heroState.pos.get();
				x = heroPos.x;
				y = heroPos.y;
			}
		}

		return html`
			<reward-element
				.image="${config.reward.image || ""}"
				.x="${x}"
				.y="${y}"
				class=${classMap({ [this.rewardAnimState]: this.isAnimatingReward })}
			></reward-element>
		`;
	}

	#handleToggleVoice() {
		if (this.voice) {
			this.voice.toggle();
		} else {
			console.warn("Voice controller not initialized");
		}
	}

	_renderHero() {
		return html`
			<hero-profile></hero-profile>
		`;
	}
}
