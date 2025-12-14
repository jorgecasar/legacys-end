import { LitElement, html, css } from 'lit';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

export class NpcElement extends LitElement {
	static properties = {
		name: { type: String },
		image: { type: String },
		icon: { type: String },
		x: { type: Number },
		y: { type: Number },
		isClose: { type: Boolean },
		action: { type: String },
		hasCollectedItem: { type: Boolean }
	};

	static styles = css`
    :host {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 15%;
      aspect-ratio: 1/1;
      pointer-events: none; /* Prevent blocking clicks if needed, but interaction is usually via keyboard */
    }

    .npc-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .npc-name-tag {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: var(--wa-space-xs);
      box-shadow: var(--wa-shadow-small);
      opacity: 0.9;
      white-space: nowrap;
      z-index: 25;
    }


  `;

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
		${this.action || 'TALK'}
        </wa-tooltip>
		${this.image ? html`
            <img src="${this.image}" id="npc-tooltip" class="npc-img" alt="${this.name}" />
            ` : html`
            <wa-icon name="${this.icon}" id="npc-tooltip"  style="font-size: var(--wa-font-size-2xl); color: ${this.isClose ? 'var(--wa-color-primary-500)' : 'var(--wa-color-neutral-200)'}; transition: color 0.3s;"></wa-icon>
            `}

      <wa-tag variant="neutral" size="small" pill class="npc-name-tag">${this.name}</wa-tag>
    `;
	}
}

customElements.define('npc-element', NpcElement);
