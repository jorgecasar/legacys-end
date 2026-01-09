import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
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
import { gameViewportStyles } from "./GameViewport.styles.js";
import "../hero-profile/hero-profile.js";
import "../npc-element/npc-element.js";
import "../reward-element/reward-element.js";
import "../viewport-elements/game-context-zones/game-context-zones.js";
import "../viewport-elements/game-controls/game-controls.js";
import "../viewport-elements/game-exit-zone/game-exit-zone.js";
import "../viewport-elements/game-theme-zones/game-theme-zones.js";

/**
 * @element game-viewport
 * @property {Object} gameState
 * @property {boolean} isAnimatingReward
 * @property {string} rewardAnimState
 * @property {boolean} isRewardCollected
 */
export class GameViewport extends LitElement {
	static properties = {
		gameState: { type: Object },
		isAnimatingReward: { state: true },
		rewardAnimState: { state: true },
		isRewardCollected: { type: Boolean },
		isVoiceActive: { type: Boolean },
	};

	/**
	 * @typedef {import('../../content/quests/quest-types.js').LevelConfig} LevelConfig
	 * @typedef {import('../../services/quest-registry-service.js').Quest} Quest
	 *
	 * @typedef {Object} GameSessionState
	 * @property {LevelConfig} [config]
	 * @property {ViewQuest} [quest]
	 * @property {Object} [levelState]
	 * @property {boolean} [levelState.hasCollectedItem]
	 * @property {boolean} [levelState.isCloseToTarget]
	 * @property {boolean} [levelState.isRewardCollected]
	 * @property {Object} [hero]
	 * @property {{x: number, y: number}} [hero.pos]
	 * @property {boolean} [hero.isEvolving]
	 * @property {string} [hero.hotSwitchState]
	 * @property {string} [hero.image]
	 * @property {string} [hero.reward]
	 * @property {Object} [ui]
	 * @property {string} [ui.lockedMessage]
	 */

	/**
	 * @typedef {{ data: Quest, chapterNumber?: number, totalChapters?: number }} ViewQuest
	 */

	static styles = gameViewportStyles;

	constructor() {
		super();
		/** @type {GameSessionState} */
		this.gameState = /** @type {GameSessionState} */ ({});
		this.isAnimatingReward = false;
		this.rewardAnimState = "";
		this.isRewardCollected = false;
		this.isVoiceActive = false;
	}

	/**
	 * @param {import("lit").PropertyValues} changedProperties
	 */
	willUpdate(changedProperties) {
		if (changedProperties.has("gameState")) {
			// Check if hasCollectedItem changed from false to true
			const oldState = changedProperties.get("gameState");
			const wasCollected = oldState?.levelState?.hasCollectedItem;
			const isCollected = this.gameState?.levelState?.hasCollectedItem;

			if (!wasCollected && isCollected) {
				this.isAnimatingReward = true;
				this.rewardAnimState = "start";
				// ... animation logic ...
			} else if (!isCollected) {
				this.isRewardCollected = false;
			}
		}

		if (this.isAnimatingReward && this.rewardAnimState === "start") {
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
				this.isRewardCollected = true; // New state to trigger visual changes
				console.log("✨ GameViewport dispatching reward-collected");
				this.dispatchEvent(
					new CustomEvent("reward-collected", {
						bubbles: true,
						composed: true,
					}),
				);
				this.requestUpdate();
			}, gameConfig.animation.rewardDuration);
		}
	}

	render() {
		if (!this.gameState || !this.gameState.config) return html``;

		const { config, quest, levelState, hero } = this.gameState;
		const backgroundStyle = config.backgroundStyle || "";
		const backgroundPath = extractAssetPath(backgroundStyle);

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
				
				<game-theme-zones
					?active="${config?.hasThemeZones || false}"
				></game-theme-zones>

				<game-exit-zone 
					.zoneConfig="${config?.exitZone || /** @type {any} */ ({})}" 
					.active="${levelState?.hasCollectedItem || false}"
				></game-exit-zone>

				<game-context-zones 
					?active="${config?.hasHotSwitch || false}"
					.state="${hero?.hotSwitchState || "legacy"}"
				></game-context-zones>

				${this._renderNPC()}
				${this._renderReward()}
				${this._renderHero()}
			</div>
		`;
	}

	_renderNPC() {
		const { config, levelState } = this.gameState;
		if (!config?.npc) return "";

		return html`
			<npc-element
				.name="${config.npc.name}"
				.image="${config.npc.image}"
				.icon="${config.npc.icon || "user"}"
				.x="${config.npc.position.x}"
				.y="${config.npc.position.y}"
				.isClose="${levelState?.isCloseToTarget || false}"
				.action="${this.gameState.ui?.lockedMessage || ""}"
				.hasCollectedItem="${levelState?.hasCollectedItem || false}"
				.isRewardCollected="${levelState?.isRewardCollected || false}"
			></npc-element>
		`;
	}

	_renderReward() {
		const { config, levelState, hero } = this.gameState;
		if (
			!this.isAnimatingReward &&
			(levelState?.hasCollectedItem || !config?.reward)
		) {
			return "";
		}

		// Calculations for animation or static position
		let x = config?.reward?.position?.x || 0;
		let y = config?.reward?.position?.y || 0;

		if (this.isAnimatingReward) {
			if (this.rewardAnimState === "growing") {
				x = 50;
				y = 50;
			} else if (this.rewardAnimState === "moving") {
				x = hero?.pos?.x || 0;
				y = hero?.pos?.y || 0;
			}
		}

		return html`
			<reward-element
				.image="${config?.reward?.image || ""}"
				.x="${x}"
				.y="${y}"
				class=${classMap({ [this.rewardAnimState]: this.isAnimatingReward })}
			></reward-element>
		`;
	}

	_renderHero() {
		const { config, hero } = this.gameState;
		if (!hero) return "";

		const transition = hero.isEvolving
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
					left: ${hero.pos?.x || 0}%; 
					top: ${hero.pos?.y || 0}%;
					opacity: ${hero.isEvolving ? 0 : 1};
					transition: ${transition};
				"
				.imageSrc="${imageSrc || ""}"
				.hotSwitchState="${hero.hotSwitchState || ""}"
			></hero-profile>
		`;
	}
}
