import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import {
	processImagePath,
	processImageSrcset,
} from "../../utils/process-assets.js";
import { npcElementStyles } from "./NpcElement.styles.js";

/**
 * @element npc-element
 * @property {string} name
 * @property {string} image
 * @property {string} icon
 * @property {number} x
 * @property {number} y
 * @property {boolean} isClose
 * @property {string} action
 * @property {boolean} hasCollectedItem
 * @property {boolean} isRewardCollected
 * @attribute name
 * @attribute icon
 * @attribute action
 */
export class NpcElement extends LitElement {
	static properties = {
		name: { type: String },
		image: { type: String },
		icon: { type: String },
		x: { type: Number },
		y: { type: Number },
		isClose: { type: Boolean },
		action: { type: String },
		hasCollectedItem: { type: Boolean },
		isRewardCollected: { type: Boolean },
	};

	static styles = npcElementStyles;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		this.name = "";
		this.image = "";
		this.icon = "";
		this.x = 0;
		this.y = 0;
		this.isClose = false;
		this.action = "";
		this.hasCollectedItem = false;
		this.isRewardCollected = false;
	}

	render() {
		// Apply position to host
		this.style.left = `${this.x}%`;
		this.style.top = `${this.y}%`;

		const open = this.isClose && !this.hasCollectedItem;

		return html`
        <wa-tooltip 
		 	for="npc-tooltip"
            .open="${open}"
            trigger="manual"
        >
		${this.action || msg("TALK")}
        </wa-tooltip>
		${
			this.image
				? html`
            <img 
							src="${ifDefined(processImagePath(this.image))}" 
							srcset="${ifDefined(processImageSrcset(this.image))}"
							sizes="15vw"
							id="npc-tooltip" 
							class="npc-img" 
							alt="${this.name}" 
						/>
            `
				: html`
            <wa-icon name="${this.icon}" id="npc-tooltip"  style="font-size: var(--wa-font-size-2xl); color: ${this.isClose ? "var(--wa-color-primary-500)" : "var(--wa-color-neutral-200)"}; transition: color 0.3s;"></wa-icon>
            `
		}

      ${
				!this.isRewardCollected
					? html`
        <wa-tag variant="neutral" size="small" class="npc-name-tag">${this.name}</wa-tag>
      `
					: ""
			}
    `;
	}
}
