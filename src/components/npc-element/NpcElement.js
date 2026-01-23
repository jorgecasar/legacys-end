import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { consume } from "@lit/context";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
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
export class NpcElement extends SignalWatcher(LitElement) {
	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../game/interfaces.js').IQuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @override */
	static properties = {
		/** @type {import('lit').PropertyDeclaration} */
		name: { type: String },
		/** @type {import('lit').PropertyDeclaration} */
		image: { type: String },
		/** @type {import('lit').PropertyDeclaration} */
		icon: { type: String },
		/** @type {import('lit').PropertyDeclaration} */
		x: { type: Number },
		/** @type {import('lit').PropertyDeclaration} */
		y: { type: Number },
		/** @type {import('lit').PropertyDeclaration} */
		isClose: { type: Boolean },
		/** @type {import('lit').PropertyDeclaration} */
		action: { type: String },
		/**
		 * Force collected state (mostly for testing).
		 */
		hasCollectedItem: { type: Boolean },
		/**
		 * Force reward collected state (mostly for testing).
		 */
		isRewardCollected: { type: Boolean },
	};

	/** @override */
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
		/** @type {string|undefined} */
		this.action = undefined;
		/** @type {boolean|undefined} */
		this.hasCollectedItem = undefined;
		/** @type {boolean|undefined} */
		this.isRewardCollected = undefined;
	}

	/** @override */
	render() {
		// Apply position to host
		this.style.left = `${this.x}%`;
		this.style.top = `${this.y}%`;

		const hasCollectedItem =
			this.hasCollectedItem ?? this.questState?.hasCollectedItem.get() ?? false;
		const isRewardCollected =
			this.isRewardCollected ??
			this.questState?.isRewardCollected.get() ??
			false;
		const action = this.action ?? this.questState?.lockedMessage.get();

		const open = this.isClose && !hasCollectedItem;

		return html`
		<wa-tooltip 
		 	for="npc-tooltip"
            .open="${open}"
            trigger="manual"
        >
		${action || msg("TALK")}
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
				!isRewardCollected
					? html`
        <wa-tag variant="neutral" size="small" class="npc-name-tag">${this.name}</wa-tag>
      `
					: ""
			}
    `;
	}
}
