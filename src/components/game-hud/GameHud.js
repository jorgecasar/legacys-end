import { html, LitElement } from "lit";
import { gameHudStyles } from "./GameHud.styles.js";

/**
 * GameHud Component
 * Displays current level info and progress.
 *
 * @element game-hud
 * @property {number} currentChapterNumber - Current chapter number (1-index based)
 * @property {number} totalChapters - Total number of chapters
 * @property {string} levelTitle - Title of the level/chapter
 * @property {string} questTitle - Title of the quest
 * @attribute currentChapterNumber
 * @attribute totalChapters
 * @attribute levelTitle
 * @attribute questTitle
 */
export class GameHud extends LitElement {
	/** @type {import('lit').PropertyDeclarations} */
	static properties = {
		currentChapterNumber: { type: Number },
		totalChapters: { type: Number },
		levelTitle: { type: String },
		questTitle: { type: String },
	};

	constructor() {
		super();
		this.currentChapterNumber = 1;
		this.totalChapters = 1;
		this.levelTitle = "";
		this.questTitle = "";
	}

	static styles = gameHudStyles;

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
