import "@awesome.me/webawesome/dist/components/tag/tag.js";

import { ContextConsumer } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { characterContext } from "../../contexts/character-context.js";
import { profileContext } from "../../contexts/profile-context.js";
import { themeContext } from "../../contexts/theme-context.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import { heroProfileStyles } from "./HeroProfile.styles.js";

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
	static properties = {
		/**
		 * Base image source for the hero.
		 */
		imageSrc: { type: String },

		/**
		 * Profile data from profileContext.
		 * @internal
		 */
		profileData: { state: true },

		/**
		 * Theme Service from themeContext.
		 * @internal
		 */
		themeService: { state: true },

		/**
		 * Suit data from characterContext.
		 * @internal
		 */
		suitData: { state: true },

		/**
		 * State for API injection visualization (legacy, mock, new).
		 */
		hotSwitchState: { type: String },
	};

	static styles = heroProfileStyles;

	constructor() {
		super();
		this.imageSrc = "";
		this.hotSwitchState = "";

		// Initialize context consumers
		new ContextConsumer(this, {
			context: profileContext,
			callback: (value) => {
				this.profileData = value;
			},
			subscribe: true,
		});
		new ContextConsumer(this, {
			context: themeContext,
			callback: (value) => {
				this.themeService = value;
			},
			subscribe: true,
		});
		new ContextConsumer(this, {
			context: characterContext,
			callback: (value) => {
				// Destructure character data into component properties
				// Fallback to empty objects to prevent undefined errors
				const { suit = {} } = value || {};
				this.suitData = suit;
			},
			subscribe: true,
		});
	}

	/**
	 * @param {Map<string, any>} changedProperties
	 */
	update(changedProperties) {
		// Reactive class update based on signal
		if (this.themeService) {
			const mode = this.themeService.themeMode.get();
			if (mode === "dark") {
				this.classList.add("wa-dark");
			} else {
				this.classList.remove("wa-dark");
			}
		}
		super.update(changedProperties);
	}

	/**
	 * @param {Map<string, any>} changedProperties
	 */
	updated(changedProperties) {
		// theme logic moved to update() for signal reactivity

		if (changedProperties.has("hotSwitchState")) {
			this.classList.remove(
				"injection-mock-api",
				"injection-legacy-api",
				"injection-new-api",
			);
			if (this.hotSwitchState) {
				this.classList.add(`injection-${this.hotSwitchState}-api`);
			}
		}
	}

	render() {
		const {
			name,
			role: _role,
			loading,
			error,
			serviceName: _serviceName,
		} = this.profileData || {};

		return html`
        <!-- Character Image -->
        ${
					this.suitData?.image || this.imageSrc
						? html`
            <img 
							src="${ifDefined(processImagePath(this.suitData?.image || this.imageSrc))}" 
							srcset="${ifDefined(processImageSrcset(this.suitData?.image || this.imageSrc))}"
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
