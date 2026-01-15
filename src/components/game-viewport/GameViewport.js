import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { gameConfig } from "../../config/game-configuration.js";
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
import { gameViewportStyles } from "./GameViewport.styles.js";

/**
 * @element game-viewport
 * @property {Object} gameState - Configuration derived state
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
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		super.willUpdate(changedProperties);

		// Handle reward collection animation trigger via signal observation
		if (this.app?.gameState) {
			const hasCollectedItem = this.app.gameState.hasCollectedItem.get();
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
		const state = /** @type {any} */ (this.gameState || {});
		const config = state.config;
		const quest = state.quest;
		const stateService = this.app?.gameState;

		if (!config || !stateService || !stateService.isPaused) return html``;

		const backgroundStyle = config.backgroundStyle || "";
		const backgroundPath = extractAssetPath(backgroundStyle);

		const hotSwitchState = stateService.hotSwitchState.get();
		const themeMode = this.app?.themeService?.themeMode.get() || "light";
		const hasCollectedItem = stateService.hasCollectedItem.get();

		return html`
			<game-hud 
				.currentChapterNumber="${quest?.chapterNumber || 0}" 
				.totalChapters="${quest?.totalChapters || 0}"
				.levelTitle="${config?.title || ""}"
				.questTitle="${quest?.data?.name || ""}"
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
				<game-controls .isVoiceActive="${this.isVoiceActive}"></game-controls>
				
				<game-zone-indicator
					.type="${"THEME_CHANGE"}"
					.zones="${config?.zones || []}"
					.currentState="${themeMode}"
				></game-zone-indicator>

				<game-zone-indicator
					.type="${"CONTEXT_CHANGE"}"
					.zones="${config?.zones || []}"
					.currentState="${hotSwitchState}"
				></game-zone-indicator>

				<game-exit-zone 
					.zoneConfig="${config?.exitZone || {}}" 
					.active="${hasCollectedItem}"
				></game-exit-zone>



				${this._renderNPC()}
				${this._renderReward()}
				${this._renderHero()}
			</div>
		`;
	}

	_renderNPC() {
		const state = /** @type {any} */ (this.gameState || {});
		const config = state.config;
		const stateService = this.app?.gameState;
		if (!config?.npc || !stateService) return "";

		const hasCollectedItem = stateService.hasCollectedItem.get();
		const isRewardCollected = stateService.isRewardCollected.get();
		const lockedMessage = stateService.lockedMessage.get();

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
				.action="${lockedMessage || ""}"
				.hasCollectedItem="${hasCollectedItem}"
				.isRewardCollected="${isRewardCollected}"
			></npc-element>
		`;
	}

	_renderReward() {
		const state = /** @type {any} */ (this.gameState || {});
		const config = state.config;
		const stateService = this.app?.gameState;
		if (!config?.reward || !stateService) return "";

		const hasCollectedItem = stateService.hasCollectedItem.get();

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
				const heroPos = stateService.heroPos.get();
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

	_renderHero() {
		const state = /** @type {any} */ (this.gameState || {});
		const config = state.config;
		const stateService = this.app?.gameState;
		if (!stateService) return "";

		const heroPos = stateService.heroPos.get();
		const isEvolving = stateService.isEvolving.get();
		const hotSwitchState = stateService.hotSwitchState.get();

		const transition = isEvolving
			? "opacity 0.5s ease-out"
			: "left 0.075s linear, top 0.075s linear";

		// Use reward image if collected, otherwise normal hero image
		const imageSrc =
			this.isRewardCollected && config?.hero?.reward
				? config.hero.reward
				: config?.hero?.image;

		return html`
			<hero-profile 
				style="
					left: ${heroPos.x}%; 
					top: ${heroPos.y}%;
					opacity: ${isEvolving ? 0 : 1};
					transition: ${transition};
				"
				.imageSrc="${imageSrc || ""}"
				.hotSwitchState="${hotSwitchState || ""}"
			></hero-profile>
		`;
	}
}
