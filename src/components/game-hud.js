import { LitElement, html, css } from 'lit';
import { sharedStyles } from '../styles/shared.js';

export class GameHud extends LitElement {
	static properties = {
		currentChapterNumber: { type: Number },
		totalChapters: { type: Number },
		levelTitle: { type: String },
		questTitle: { type: String }
	};

	constructor() {
		super();
		this.currentChapterNumber = 1;
		this.totalChapters = 1;
		this.levelTitle = '';
		this.questTitle = '';
	}

	static styles = [
		...sharedStyles,
		css`
		:host {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: var(--wa-space-m) var(--wa-space-m);
			box-sizing: border-box;
			color: var(--wa-color-text-default);
			z-index: 50;
			background-color: var(--wa-color-surface-default);
		}

		.wa-stack {
			flex-direction: column-reverse;
		}

		h5 {
			margin: 0;
		color: var(--wa-color-text-quiet);
		}

		.chapter-counter {
			font-weight: var(--wa-font-weight-bold);
		}

		.chapter-total {
			font-size: var(--wa-font-size-s);
			color: var(--wa-color-text-quiet);
		}
  `];

	render() {
		return html`
      <div class="wa-stack">
	  	<h5>${this.levelTitle}</h5>
        <h6>${this.questTitle}</h6>
      </div>

      <h3 class="chapter-counter">
        ${this.currentChapterNumber}<span class="chapter-total">/${this.totalChapters}</span>
      </h3>
    `;
	}
}

customElements.define('game-hud', GameHud);
