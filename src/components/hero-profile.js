import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { ContextConsumer } from "@lit/context";
import { html, LitElement } from "lit";
import { characterContext } from "../contexts/character-context.js";
import { profileContext } from "../contexts/profile-context.js";
import { themeContext } from "../contexts/theme-context.js";
import { processImagePath } from "../utils/process-assets.js";
import { styles } from "./hero-profile.css.js";

/**
 * @element hero-profile
 * @property {string} imageSrc
 * @property {Object} profileData
 * @property {Object} themeData
 * @property {Object} suitData
 * @property {Object} gearData
 * @property {Object} powerData
 * @property {Object} masteryData
 * @property {string} tooltipText
 * @property {string} hotSwitchState
 */
export class HeroProfile extends LitElement {
	static properties = {
		imageSrc: { type: String },
		profileData: { state: true },
		themeData: { state: true },
		suitData: { state: true },
		gearData: { state: true },
		powerData: { state: true },
		masteryData: { state: true },
		tooltipText: { type: String },
		hotSwitchState: { type: String },
	};

	constructor() {
		super();
		this.imageSrc = "";
		this.tooltipText = "";
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
				this.themeData = value;
			},
			subscribe: true,
		});
		new ContextConsumer(this, {
			context: characterContext,
			callback: (value) => {
				// Destructure character data into component properties
				// Fallback to empty objects to prevent undefined errors
				const { suit = {}, gear = {}, power = {}, mastery = {} } = value || {};
				this.suitData = suit;
				this.gearData = gear;
				this.powerData = power;
				this.masteryData = mastery;
			},
			subscribe: true,
		});
	}

	/**
	 * @param {Map<string, any>} changedProperties
	 */
	updated(changedProperties) {
		if (changedProperties.has("themeData") && this.themeData) {
			if (this.themeData.themeMode === "dark") {
				this.classList.add("wa-dark");
			} else {
				this.classList.remove("wa-dark");
			}
		}

		if (changedProperties.has("hotSwitchState")) {
			this.classList.remove(
				"injection-test-api",
				"injection-legacy-api",
				"injection-new-api",
			);
			if (this.hotSwitchState) {
				this.classList.add(`injection-${this.hotSwitchState}-api`);
			}
		}
	}

	static styles = styles;

	render() {
		const {
			name,
			role: _role,
			loading,
			error,
			serviceName: _serviceName,
		} = this.profileData || {};

		return html`
        <!-- Optional Tooltip -->
        ${
					this.tooltipText
						? html`
          <div class="hero-tooltip">${this.tooltipText}</div>
        `
						: ""
				}

        <!-- Character Image -->
        ${
					this.suitData?.image || this.imageSrc
						? html`
            <img src="${processImagePath(this.suitData?.image || this.imageSrc)}" class="character-img" alt="Alarion" />
        `
						: ""
				}

		<!-- Gear Image -->
		${
			this.gearData?.image
				? html`
			<img src="${processImagePath(this.gearData.image)}" class="gear-img" alt="Gear" />
		`
				: ""
		}

		<!-- Weapon Image -->
		${
			this.powerData?.image
				? html`
			<img src="${processImagePath(this.powerData.image)}" class="weapon-img" alt="Weapon" />
		`
				: ""
		}

        <!-- Nameplate (Bottom) -->
        <div class="nameplate">
          ${
						loading
							? html`<span class="loading">...</span>`
							: error
								? html`<span class="error">${error}</span>`
								: html`
                  <wa-tag variant="neutral" size="small" pill class="name-tag">${name || "Alarion"}</wa-tag>
                `
					}
        </div>
    `;
	}
}

customElements.define("hero-profile", HeroProfile);
