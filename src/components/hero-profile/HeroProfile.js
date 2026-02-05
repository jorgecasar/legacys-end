import "@awesome.me/webawesome/dist/components/tag/tag.js";
import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { apiClientsContext } from "../../contexts/api-clients-context.js";
import { characterContext } from "../../contexts/character-context.js";
import { loggerContext } from "../../contexts/logger-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { ServiceController } from "../../controllers/service-controller.js";
import { ThemeModes } from "../../core/constants.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import { heroProfileStyles } from "./HeroProfile.styles.js";

/**
 * @typedef {import('../../game/interfaces.js').IHeroStateService} IHeroStateService
 * @typedef {import('../../contexts/profile-context.js').Profile} Profile
 * @typedef {import('../../contexts/character-context.js').CharacterContext} CharacterContext
 * @typedef {import('../../contexts/api-clients-context.js').UserApiClients} UserApiClients
 * @typedef {import('../../services/interfaces.js').IThemeService} IThemeService
 * @typedef {import('../../services/interfaces.js').ILoggerService} ILoggerService
 * @typedef {import('../../services/interfaces.js').IQuestController} IQuestController
 */

/**
 * @typedef {Object} ProfileData
 * @property {string} [name]
 * @property {boolean} [loading]
 * @property {string} [error]
 */

/**
 * @typedef {Object} SuitData
 * @property {string} [image]
 */

/**
 * @element hero-profile
 * @extends {LitElement}
 */
export class HeroProfile extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState = /** @type {IHeroStateService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {Profile} */
	profile = /** @type {Profile} */ (/** @type {unknown} */ ({}));

	/** @type {IThemeService} */
	@consume({ context: themeContext, subscribe: true })
	accessor themeService = /** @type {IThemeService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {CharacterContext} */
	@consume({ context: characterContext, subscribe: true })
	accessor suitData = /** @type {CharacterContext} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {UserApiClients} */
	@consume({ context: apiClientsContext, subscribe: true })
	accessor apiClients = /** @type {UserApiClients} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController = /** @type {IQuestController} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {ServiceController | null} */
	serviceController = null;

	/** @override */
	static properties = {
		/**
		 * Base image source for the hero.
		 */
		imageSrc: { type: String },

		/**
		 * State for API injection visualization (legacy, mock, new).
		 */
		hotSwitchState: { type: String },
	};

	/** @override */
	static styles = heroProfileStyles;

	constructor() {
		super();
		/** @type {string} */
		this.imageSrc = "";
		/** @type {string|undefined} */
		this.hotSwitchState = undefined;
	}

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 * @override
	 */
	update(changedProperties) {
		// Initialize ServiceController when all dependencies are available
		if (
			!this.serviceController &&
			this.heroState &&
			this.questController &&
			this.apiClients
		) {
			this.serviceController = new ServiceController(this, {
				heroState: this.heroState,
				questController: this.questController,
				apiClients: this.apiClients,
			});
		}

		const heroState = this.heroState;

		// Reactive class update based on signal
		if (this.themeService) {
			const mode = this.themeService.themeMode.get();
			if (mode === ThemeModes.DARK) {
				this.classList.add("wa-dark");
			} else {
				this.classList.remove("wa-dark");
			}
		}

		// Handle positioning and evolution
		if (heroState) {
			const pos = heroState.pos.get();
			const isEvolving = heroState.isEvolving.get();

			this.style.left = `${pos.x}%`;
			this.style.top = `${pos.y}%`;
			this.style.opacity = isEvolving ? "0" : "1";
			this.style.transition = isEvolving
				? "opacity 0.5s ease-out"
				: "left 0.075s linear, top 0.075s linear";
		}

		super.update(changedProperties);
	}

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		// theme logic moved to update() for signal reactivity
		const heroState = this.heroState;
		const hotSwitchState =
			this.hotSwitchState ?? heroState?.hotSwitchState.get();

		if (changedProperties.has("hotSwitchState") || heroState) {
			this.classList.remove(
				"injection-mock-api",
				"injection-legacy-api",
				"injection-new-api",
			);
			if (hotSwitchState) {
				this.classList.add(`injection-${hotSwitchState}-api`);
			}
		}
	}

	/** @override */
	render() {
		const { name, loading, error } = this.profile || {};
		const heroState = this.heroState;
		const imageSrc = heroState?.imageSrc.get() || this.imageSrc;

		return html`
        <!-- Character Image -->
        ${
					this.suitData?.suit?.image || imageSrc
						? html`
            <img 
							src="${ifDefined(processImagePath(this.suitData?.suit?.image || imageSrc))}" 
							srcset="${ifDefined(processImageSrcset(this.suitData?.suit?.image || imageSrc))}"
							sizes="15vw"
							class="character-img" 
							alt="Alarion" 
						/>
        `
						: ""
				}

        <!-- Nameplate (Bottom) -->
        ${
					loading
						? html`<span class="loading">...</span>`
						: error
							? html`<span class="error">${error}</span>`
							: html`
                  <wa-tag variant="neutral" size="small" class="name-tag">${name || "Alarion"}</wa-tag>
                `
				}
    `;
	}
}
