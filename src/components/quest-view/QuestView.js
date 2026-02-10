import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { loggerContext } from "../../contexts/logger-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { gameStoreContext } from "../../core/store.js";
import "../game-viewport/game-viewport.js";
import "../level-dialog/level-dialog.js";
import "../pause-menu/pause-menu.js";
import "../victory-screen/victory-screen.js";
import { UIEvents } from "../../core/events.js";
import { questViewStyles } from "./quest-view.css.js";

/**
 * QuestView - Page wrapper for the game
 *
 * @element quest-view
 * @extends {LitElement}
 * @typedef {import('../../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../../types/game.d.js').IWorldStateService} IWorldStateService
 * @typedef {import('../../types/services.d.js').IQuestController} IQuestController
 * @typedef {import('../../types/services.d.js').ISessionService} ISessionService
 * @typedef {import('../../types/services.d.js').ILoggerService} ILoggerService
 */
export class QuestView extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController = /** @type {IQuestController} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {import('../../core/store.js').GameStore} */
	@consume({ context: gameStoreContext, subscribe: true })
	accessor gameStore = /** @type {import('../../core/store.js').GameStore} */ (
		/** @type {unknown} */ (null)
	);

	get heroState() {
		return this.gameStore?.hero;
	}

	get questState() {
		return this.gameStore?.quest;
	}

	get worldState() {
		return this.gameStore?.world;
	}

	/** @type {ISessionService} */
	@consume({ context: sessionContext, subscribe: true })
	accessor sessionService = /** @type {ISessionService} */ (
		/** @type {unknown} */ (null)
	);

	/** @type {ILoggerService} */
	@consume({ context: loggerContext })
	accessor logger = /** @type {ILoggerService} */ (
		/** @type {unknown} */ (null)
	);

	/** @override */
	static styles = questViewStyles;

	/** @override */
	static properties = {
		isMenuOpen: { state: true },
		isInventoryOpen: { state: true },
		showLevelTitle: { state: true },
	};

	/**
	 * @param {CustomEvent<{text: string, nextText: string}>} e
	 */
	#handleSlideChanged(e) {
		this.worldState?.setCurrentDialogText(e.detail.text);
		this.worldState?.setNextDialogText(e.detail.nextText);
	}

	/** @override */
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
						@complete="${() => this.#handleLevelComplete()}"
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
					@close="${() => this.dispatchEvent(new CustomEvent(UIEvents.CLOSE_DIALOG))}"
					@slide-changed="${(/** @type {CustomEvent} */ e) => this.#handleSlideChanged(e)}"
				></level-dialog>
			`
					: ""
			}
		`;
	}

	nextDialogSlide() {
		this.worldState?.nextSlide();
	}

	prevDialogSlide() {
		this.worldState?.prevSlide();
	}

	#handleLevelComplete() {
		this.questController?.completeChapter();
	}
}
