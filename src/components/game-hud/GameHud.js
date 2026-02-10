import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { loggerContext } from "../../contexts/logger-context.js";
import { gameStoreContext } from "../../core/store.js";
import { gameHudStyles } from "./GameHud.styles.js";

/**
 * @element game-hud
 * @extends {LitElement}
 * @typedef {import('../../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../../types/game.d.js').IQuestStateService} IQuestStateService
 */
export class GameHud extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {import('../../core/store.js').GameStore} */
	@consume({ context: gameStoreContext, subscribe: true })
	accessor gameStore = /** @type {import('../../core/store.js').GameStore} */ (
		/** @type {unknown} */ (null)
	);

	get questState() {
		return this.gameStore?.quest;
	}

	/** @type {ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
		/** @type {unknown} */ (null)
	);

	/** @override */
	static styles = gameHudStyles;

	/** @override */
	render() {
		if (!this.questState) return nothing;

		const currentChapterNumber = this.questState.currentChapterNumber.get();
		const totalChapters = this.questState.totalChapters.get();
		const levelTitle = this.questState.levelTitle.get();
		const questTitle = this.questState.questTitle.get();

		return html`
      <div class="wa-stack">
	  	${levelTitle ? html`<h5>${levelTitle}</h5>` : nothing}
	  	${questTitle ? html`<h6>${questTitle}</h6>` : nothing}
      </div>

      <h3 class="chapter-counter">
        ${currentChapterNumber}<span class="chapter-total">/${totalChapters}</span>
      </h3>
    `;
	}
}
