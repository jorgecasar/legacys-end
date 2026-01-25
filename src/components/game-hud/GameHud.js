import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement, nothing } from "lit";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { gameHudStyles } from "./GameHud.styles.js";

/**
 * @element game-hud
 * @extends {LitElement}
 */
export class GameHud extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../game/interfaces.js').IQuestStateService} */ (
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
