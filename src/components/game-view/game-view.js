import { css, html, LitElement } from "lit";
import "./victory-screen.js";
import "../hero-profile.js";
import "../npc-element.js";
import "../reward-element.js";
import "../game-viewport.js";
import "../level-dialog.js";
import "../pause-menu.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { setupCharacterContexts } from "../../setup/setup-character-contexts.js";
import { setupCollision } from "../../setup/setup-collision.js";
import { setupGame } from "../../setup/setup-game.js";
import { setupInteraction } from "../../setup/setup-interaction.js";
import { setupKeyboard } from "../../setup/setup-keyboard.js";
import { setupService } from "../../setup/setup-service.js";
import { setupVoice } from "../../setup/setup-voice.js";
import { setupZones } from "../../setup/setup-zones.js";
import { sharedStyles } from "../../styles/shared.js";

/**
 * @element game-view
 * @property {Object} gameState
 * @property {import('../../legacys-end-app.js').LegacysEndApp} app - Reference to main app for controller setup (temporary, will be removed)
 */
export class GameView extends LitElement {
	static properties = {
		gameState: { type: Object },
		app: { type: Object },
	};

	constructor() {
		super();
		this.gameState = {};
		this.app = null;
		this._controllersInitialized = false;
	}

	connectedCallback() {
		super.connectedCallback();
		// Initialize controllers when component is connected and app is available
		if (this.app && !this._controllersInitialized) {
			this.#setupControllers();
			this._controllersInitialized = true;
		}
	}

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
	 * TODO: Refactor to remove app dependency
	 */
	#setupControllers() {
		// Initialize basic input controllers
		setupKeyboard(this.app);
		setupGame(this.app);
		setupVoice(this.app);

		// Initialize game mechanics controllers
		setupZones(this.app);
		setupCollision(this.app);
		setupService(this.app);

		// Initialize context and interaction
		setupCharacterContexts(this.app);
		setupInteraction(this.app);

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

	render() {
		const { config, ui, quest, hero } = this.gameState || {};

		if (!config) {
			return html`<div>Loading level data...</div>`;
		}

		// Replaced hardcoded levels with flags
		const _canToggleTheme = config.canToggleTheme;
		const _hasHotSwitch = config.hasHotSwitch;
		const _isFinalBoss = config.isFinalBoss;

		// Dialog Config Logic
		const dialogConfig = config;

		return html`

			<pause-menu
				.open="${ui?.isPaused}"
				@resume="${() => this.dispatchEvent(new CustomEvent("resume"))}"
				@restart="${() => this.dispatchEvent(new CustomEvent("restart"))}"
				@quit="${() => this.dispatchEvent(new CustomEvent("quit"))}"
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
					.hotSwitchState="${hero?.hotSwitchState}"
					@complete="${() => this.dispatchEvent(new CustomEvent("complete"))}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	static styles = [
		...sharedStyles,
		css`
		:host {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100vh;
			width: 100vw;
			background-color: var(--wa-color-neutral-fill-loud);
			background-image: linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px);
			background-size: 40px 40px;
			color: var(--wa-color-text-normal);
			position: relative;
			overflow: hidden;
			font-family: var(--wa-font-family-body);
			box-sizing: border-box;
		}

		main {
			width: 100%;
			max-width: 90rem;
			height: 100%;
			box-shadow: var(--wa-shadow-large);
			position: relative;
			transition: all 1s;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
		}

	`,
	];
}

customElements.define("game-view", GameView);
