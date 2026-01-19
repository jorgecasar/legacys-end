import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { questLoaderContext } from "../../contexts/quest-loader-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
import "../game-viewport/game-viewport.js";
import "../level-dialog/level-dialog.js";
import "../pause-menu/pause-menu.js";
import "../victory-screen/victory-screen.js";
import { questViewStyles } from "./quest-view.css.js";

/**
 * QuestView - Page wrapper for the game
 *
 * @element quest-view
 */
export class QuestView extends SignalWatcher(LitElement) {
	/** @type {import('../../game/interfaces.js').IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState = /** @type {any} */ (null);

	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState = /** @type {any} */ (null);

	/** @type {import('../../game/interfaces.js').IWorldStateService} */
	@consume({ context: worldStateContext, subscribe: true })
	accessor worldState = /** @type {any} */ (null);

	/** @type {import('../../services/quest-loader-service.js').QuestLoaderService} */
	@consume({ context: questLoaderContext, subscribe: true })
	accessor questLoader = /** @type {any} */ (null);

	/** @type {import('../../services/session-service.js').SessionService} */
	@consume({ context: sessionContext, subscribe: true })
	accessor sessionService = /** @type {any} */ (null);

	static styles = questViewStyles;

	/**
	 * @param {CustomEvent<{text: string}>} e
	 */
	#handleSlideChanged(e) {
		this.worldState?.setCurrentDialogText(e.detail.text);
	}

	render() {
		if (!this.worldState || !this.questState || !this.sessionService) {
			return html`<div>Loading services...</div>`;
		}

		const showDialog = this.worldState.showDialog.get();
		const currentQuest = this.sessionService.currentQuest.get();

		if (!currentQuest) {
			return html`<div>No active quest</div>`;
		}

		return html`
			<pause-menu></pause-menu>

			${
				this.questState.isQuestCompleted.get()
					? html`<victory-screen></victory-screen>`
					: html`
				<main>
					<game-viewport
						@next-slide="${() => this.nextDialogSlide()}"
						@prev-slide="${() => this.prevDialogSlide()}"
						@request-dialog="${() => this.worldState.setShowDialog(true)}"
						@show-locked-message="${(/** @type {CustomEvent} */ e) => this.questState.setLockedMessage(e.detail.message)}"
					></game-viewport>
				</main>
			`
			}

			${
				showDialog && !this.questState.isQuestCompleted.get()
					? html`
				<level-dialog
					@complete="${() => this.#handleLevelComplete()}"
					@close="${() => this.dispatchEvent(new CustomEvent("close-dialog"))}"
					@slide-changed="${(/** @type {CustomEvent} */ e) => this.#handleSlideChanged(e)}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	nextDialogSlide() {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.nextSlide();
	}

	prevDialogSlide() {
		const dialog =
			/** @type {import('../level-dialog/level-dialog.js').LevelDialog} */ (
				this.shadowRoot?.querySelector("level-dialog")
			);
		if (dialog) dialog.prevSlide();
	}

	#handleLevelComplete() {
		const viewport =
			/** @type {import('../game-viewport/GameViewport.js').GameViewport} */ (
				this.shadowRoot?.querySelector("game-viewport")
			);
		if (viewport) {
			viewport.handleLevelComplete();
		}
	}
}
