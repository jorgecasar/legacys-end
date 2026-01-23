import "@awesome.me/webawesome/dist/components/tag/tag.js";
import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { characterContext } from "../../contexts/character-context.js";
import { profileContext } from "../../contexts/profile-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import { ThemeModes } from "../../core/constants.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import { heroProfileStyles } from "./HeroProfile.styles.js";

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
 * Main hero profile component.
 * Displays the hero's image, gear, weapon, and nameplate.
 * Connects to profile, theme, and character contexts.
 *
 * @element hero-profile
 * @property {string} imageSrc - Base image source for the hero.
 * @property {string} tooltipText - Optional tooltip text.
 * @property {string} hotSwitchState - State for API injection visualization (legacy, mock, new).
 */
export class HeroProfile extends SignalWatcher(LitElement) {
	/** @type {import('../../game/interfaces.js').IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState =
		/** @type {import('../../game/interfaces.js').IHeroStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {ProfileData} */
	@consume({ context: profileContext, subscribe: true })
	accessor profileData = /** @type {ProfileData} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {import('../../services/interfaces.js').IThemeService} */
	@consume({ context: themeContext, subscribe: true })
	accessor themeService =
		/** @type {import('../../services/interfaces.js').IThemeService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {SuitData} */
	@consume({ context: characterContext, subscribe: true })
	accessor suitData = /** @type {SuitData} */ (/** @type {unknown} */ (null));

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
		const { name, loading, error } = this.profileData || {};

		const heroState = this.heroState;
		const imageSrc = heroState?.imageSrc.get() || this.imageSrc;

		return html`
        <!-- Character Image -->
        ${
					this.suitData?.image || imageSrc
						? html`
            <img 
							src="${ifDefined(processImagePath(this.suitData?.image || imageSrc))}" 
							srcset="${ifDefined(processImageSrcset(this.suitData?.image || imageSrc))}"
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
