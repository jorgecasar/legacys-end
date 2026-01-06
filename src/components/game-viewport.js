import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import { html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { GAME_CONFIG } from "../constants/game-config.js";
import { processBackgroundStyle } from "../utils/process-assets.js";
import "./game-hud.js";
import { styles } from "./game-viewport.css.js";
import "./hero-profile.js";
import "./npc-element.js";
import "./reward-element.js";
import "./viewport-elements/game-context-zones.js";
import "./viewport-elements/game-controls.js";
import "./viewport-elements/game-exit-zone.js";
import "./viewport-elements/game-theme-zones.js";

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
	};

	/**
	 * @typedef {import('../content/quests/quest-types.js').LevelConfig} LevelConfig
	 * @typedef {import('../services/quest-registry-service.js').Quest} Quest
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

	constructor() {
		super();
		/** @type {GameSessionState} */
		this.gameState = /** @type {GameSessionState} */ ({});
		this.isAnimatingReward = false;
		this.rewardAnimState = "";
		this.isRewardCollected = false;
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
			}, GAME_CONFIG.ANIMATION.REWARD_DELAY);

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
			}, GAME_CONFIG.ANIMATION.REWARD_DURATION);
		}
	}

	render() {
		if (!this.gameState || !this.gameState.config) return html``;

		const { config, quest, levelState, hero } = this.gameState;
		const backgroundStyle = config.backgroundStyle || "#374151";

		return html`
			<game-hud 
				.currentChapterNumber="${quest?.chapterNumber}" 
				.totalChapters="${quest?.totalChapters}"
				.levelTitle="${config.title}"
				.questTitle="${quest?.data?.name}"
			></game-hud>

			<div class="game-area" style="background: ${processBackgroundStyle(backgroundStyle)}">
				<game-controls></game-controls>
				
				<game-theme-zones
					?active="${config.hasThemeZones}"
				></game-theme-zones>

				<game-exit-zone 
					.zoneConfig="${config.exitZone}" 
					?active="${levelState?.hasCollectedItem}"
				></game-exit-zone>

				<game-context-zones 
					?active="${config?.hasHotSwitch}"
					.state="${hero?.hotSwitchState}"
				></game-context-zones>

				${this._renderNPC()}
				${this._renderReward()}
				${this._renderHero()}
			</div>
		`;
	}

	_renderNPC() {
		const { config, levelState } = this.gameState;
		if (!config.npc) return "";

		return html`
			<npc-element
				.name="${config.npc.name}"
				.image="${config.npc.image}"
				.icon="${config.npc.icon}"
				.x="${config.npc.position.x}"
				.y="${config.npc.position.y}"
				.isClose="${levelState?.isCloseToTarget}"
				.action="${this.gameState.ui?.lockedMessage}"
				.hasCollectedItem="${levelState?.hasCollectedItem}"
				.isRewardCollected="${levelState.isRewardCollected}"
			></npc-element>
		`;
	}

	_renderReward() {
		const { config, levelState, hero } = this.gameState;
		if (
			!this.isAnimatingReward &&
			(levelState?.hasCollectedItem || !config.reward)
		) {
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
				x = hero?.pos?.x;
				y = hero?.pos?.y;
			}
		}

		return html`
			<reward-element
				.image="${config.reward.image}"
				.icon="${config.reward.icon}"
				.x="${x}"
				.y="${y}"
				class=${classMap({ [this.rewardAnimState]: this.isAnimatingReward })}
			></reward-element>
		`;
	}

	_renderHero() {
		const { config, hero } = this.gameState;
		const transition = hero?.isEvolving
			? "opacity 0.5s ease-out"
			: "left 0.075s linear, top 0.075s linear";

		// Use reward image if collected, otherwise normal hero image
		const imageSrc =
			this.isRewardCollected && config.hero?.reward
				? config.hero.reward
				: config.hero?.image;

		return html`
			<hero-profile 
				style="
					left: ${hero.pos.x}%; 
					top: ${hero.pos.y}%;
					opacity: ${hero.isEvolving ? 0 : 1};
					transition: ${transition};
				"
				.imageSrc="${imageSrc}"
				.hotSwitchState="${hero.hotSwitchState}"
			></hero-profile>
		`;
	}

	static styles = styles;
}

customElements.define("game-viewport", GameViewport);
