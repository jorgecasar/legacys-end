import { consume, provide } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { gameConfig } from "../../config/game-configuration.js";
import { dialogStateContext } from "../../contexts/dialog-context.js";
import { localizationContext } from "../../contexts/localization-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import { setupCharacterContexts } from "../../setup/setup-character-contexts.js";
import { setupCollision } from "../../setup/setup-collision.js";
import { setupGameController } from "../../setup/setup-game.js";
import { setupInteraction } from "../../setup/setup-interaction.js";
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
import { ZoneTypes } from "../../core/constants.js";
import { UIEvents } from "../../core/events.js";
import { gameViewportStyles } from "./GameViewport.styles.js";

/**
 * @element game-viewport
 * @extends {LitElement}
 */
export class GameViewport extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {import('../../game/interfaces.js').IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState =
		/** @type {import('../../game/interfaces.js').IHeroStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../contexts/dialog-context.js').DialogState} */
	@provide({ context: dialogStateContext })
	accessor dialogState = {
		isDialogOpen: false,
		isRewardCollected: false,
		npcName: null,
		exitZoneName: null,
		chapterTitle: null,
		currentDialogText: null,
	};

	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../game/interfaces.js').IQuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IWorldStateService} */
	@consume({ context: worldStateContext, subscribe: true })
	accessor worldState =
		/** @type {import('../../game/interfaces.js').IWorldStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/interfaces.js').IQuestLoaderService} */
	@consume({ context: questLoaderContext, subscribe: true })
	accessor questLoader =
		/** @type {import('../../services/interfaces.js').IQuestLoaderService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/session-service.js').SessionService} */
	@consume({ context: sessionContext, subscribe: true })
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/interfaces.js').ILocalizationService} */
	@consume({ context: localizationContext, subscribe: true })
	accessor localizationService =
		/** @type {import('../../services/interfaces.js').ILocalizationService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/interfaces.js').IThemeService} */
	@consume({ context: themeContext, subscribe: true })
	accessor themeService =
		/** @type {import('../../services/interfaces.js').IThemeService} */ (
			/** @type {unknown} */ (null)
		);

	/** @override */
	static properties = {
		isAnimatingReward: { state: true },
		rewardAnimState: { state: true },
		isRewardCollected: { state: true },
	};

	/** @override */
	static styles = gameViewportStyles;

	constructor() {
		super();
		this.isAnimatingReward = false;
		this.rewardAnimState = "";
		this.isRewardCollected = false;

		// Controllers
		this._controllersInitialized = false;
		this._autoMoveRequestId = null;

		/** @type {import('../../controllers/collision-controller.js').CollisionController | null} */
		this.collision = null;
		/** @type {import('../../controllers/game-zone-controller.js').GameZoneController | null} */
		this.zones = null;
		/** @type {import('../../controllers/interaction-controller.js').InteractionController | null} */
		this.interaction = null;
		/** @type {import('../../controllers/game-controller.js').GameController | null} */
		this.gameController = null;
	}

	/**
	 * @param {import("lit").PropertyValues<this>} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		super.updated(changedProperties);

		// Initialize controllers once services are available via context
		const allServicesReady =
			this.questController &&
			this.heroState &&
			this.questState &&
			this.worldState &&
			this.themeService &&
			this.sessionService;

		if (allServicesReady && !this._controllersInitialized) {
			this.#setupControllers();
			this._controllersInitialized = true;
		}

		// Sync Hero Image from current chapter config
		const config = this.questController?.currentChapter;
		if (config && this.questState) {
			const isRewardCollected = this.questState.isRewardCollected.get();
			const heroImage =
				isRewardCollected && config.hero?.reward
					? config.hero.reward
					: config.hero?.image;
			this.heroState.setImageSrc(heroImage || "");
		}
	}

	/** @override */
	disconnectedCallback() {
		super.disconnectedCallback();
		if (typeof this.stopAutoMove === "function") {
			this.stopAutoMove();
		}
	}

	/**
	 * Setup game controllers using explicit dependency injection.
	 */
	#setupControllers() {
		this.#setupGameMechanics();
		this.#setupInputHandlers();
		this.#setupGameFlow();
		this.requestUpdate();
	}

	/**
	 * Setup fundamental game mechanics controllers
	 */
	#setupGameMechanics() {
		setupZones(this, {
			heroState: this.heroState,
			questState: this.questState,
			questController: this.questController,
			themeService: this.themeService,
		});
		setupCollision(this, {
			heroState: this.heroState,
			questState: this.questState,
			questController: this.questController,
		});
		setupCharacterContexts(this, {
			heroState: this.heroState,
			questState: this.questState,
			questController: this.questController,
			themeService: this.themeService,
		});
		setupInteraction(this, {
			worldState: this.worldState,
			questState: this.questState,
			heroState: this.heroState,
			questController: this.questController,
			questLoader: this.questLoader,
		});
	}

	#setupInputHandlers() {
		// All input handlers are now in GameControls
	}

	/**
	 * Setup high-level game flow controllers
	 */
	#setupGameFlow() {
		setupGameController(this, {
			logger: this.questController?.options?.logger,
			heroState: this.heroState,
			questState: this.questState,
			worldState: this.worldState,
			questController: this.questController,
			questLoader: this.questLoader,
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

		if (!this.heroState) return;

		const current = this.heroState.pos.get();
		const nextX = Math.max(0, Math.min(100, current.x + dx));
		const nextY = Math.max(0, Math.min(100, current.y + dy));

		// Handle collision detection
		const chapter = this.questController?.currentChapter;
		const isColliding = chapter?.obstacles?.some(
			(
				/** @type {import('../../content/quests/quest-types.js').Rect} */ obstacle,
			) =>
				this.collision?.checkAABB(
					{ x: nextX, y: nextY, width: 5, height: 5 },
					obstacle,
				),
		);

		if (!isColliding) {
			this.heroState.setPos(nextX, nextY);
		}
	}

	/**
	 * Handles interaction with game objects
	 */
	handleInteract() {
		const showDialog = this.worldState?.showDialog?.get();
		if (showDialog) return;

		if (this.interaction) {
			this.interaction.handleInteract();
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
		this.questLoader?.advanceChapter();
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
		if (this.worldState) {
			this.worldState.setPaused(!this.worldState.isPaused.get());
		}
	}

	/**
	 * Advances to the next dialog slide
	 */
	nextDialogSlide() {
		this.dispatchEvent(new CustomEvent(UIEvents.NEXT_SLIDE));
	}

	/**
	 * Returns to the previous dialog slide
	 */
	prevDialogSlide() {
		this.dispatchEvent(new CustomEvent(UIEvents.PREV_SLIDE));
	}

	/**
	 * @param {import("lit").PropertyValues<this>} changedProperties
	 * @override
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		// Handle reward collection animation trigger via signal observation
		if (this.questState) {
			const hasCollectedItem = this.questState.hasCollectedItem.get();

			if (!this._lastHasCollectedItem && hasCollectedItem) {
				this.startRewardAnimation();
			} else if (!hasCollectedItem) {
				this.isRewardCollected = false;
			}
			this._lastHasCollectedItem = hasCollectedItem;
		}

		// Update Dialog State Context
		const chapter = this.questController?.currentChapter;
		this.dialogState = {
			isDialogOpen: this.worldState?.showDialog.get() || false,
			isRewardCollected: this.questState?.isRewardCollected.get() || false,
			npcName: chapter?.npc?.name || null,
			exitZoneName: chapter?.exitZone ? "exit" : null,
			chapterTitle: chapter?.title || null,
			currentDialogText: this.worldState?.currentDialogText.get() || null,
			nextDialogText: this.worldState?.nextDialogText?.get() || null,
		};
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
				new CustomEvent(UIEvents.REWARD_COLLECTED, {
					bubbles: true,
					composed: true,
				}),
			);
			this.requestUpdate();
		}, gameConfig.animation.rewardDuration);
	}

	/** @override */
	render() {
		if (!this.questState || !this.questController) return nothing;

		/** @type {any} */
		const config = this.questController.currentChapter || {};
		let backgroundStyle = config.backgroundStyle || "";

		if (
			this.questState.isRewardCollected.get() &&
			config.backgroundStyleReward
		) {
			backgroundStyle = config.backgroundStyleReward;
		}

		const backgroundPath = extractAssetPath(backgroundStyle);

		return html`
			<game-hud></game-hud>

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
						: nothing
				}
				<game-zone-indicator 
					.type="${ZoneTypes.THEME_CHANGE}"
					.zones="${config.zones || []}"
				></game-zone-indicator>

				<game-zone-indicator 
					.type="${ZoneTypes.CONTEXT_CHANGE}"
					.zones="${config.zones || []}"
				></game-zone-indicator>

				<game-exit-zone></game-exit-zone>

				${this._renderNPC()}
				${this._renderReward()}
				${this._renderHero()}
			</div>
			<game-controls 
				@move="${(/** @type {CustomEvent} */ e) => this.handleMove(e.detail.dx, e.detail.dy)}"
				@move-to="${(/** @type {CustomEvent} */ e) => this.moveTo(e.detail.x, e.detail.y)}"
				@move-to-npc="${() => {
					const npcPos = this.questController?.currentChapter?.npc?.position;
					if (npcPos) this.moveTo(npcPos.x - 8, npcPos.y);
				}}"
				@move-to-exit="${() => {
					const exitZone = this.questController?.currentChapter?.exitZone;
					if (exitZone) this.moveTo(exitZone.x, exitZone.y);
				}}"
				@interact="${() => this.handleInteract()}"
				@toggle-pause="${() => this.togglePause()}"
				@next-chapter="${() => this.handleLevelComplete()}"
				@next-slide="${() => this.nextDialogSlide()}"
				@prev-slide="${() => this.prevDialogSlide()}"
			></game-controls>
		`;
	}

	_renderNPC() {
		const config = this.questController.currentChapter;
		if (!config?.npc) return nothing;

		const isCloseToTarget = this.interaction?.isCloseToNpc() || false;

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
		const config = this.questController.currentChapter;
		if (!config?.reward) return nothing;

		const hasCollectedItem = this.questState.hasCollectedItem.get();

		if (!this.isAnimatingReward && hasCollectedItem) {
			return nothing;
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
				class=${classMap({ [this.rewardAnimState || ""]: this.isAnimatingReward })}
			></reward-element>
		`;
	}

	_renderHero() {
		return html`
			<hero-profile></hero-profile>
		`;
	}
}
