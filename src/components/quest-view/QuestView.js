import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { loggerContext } from "../../contexts/logger-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { heroStateContext } from "../../game/contexts/hero-context.js";
import { questStateContext } from "../../game/contexts/quest-context.js";
import { worldStateContext } from "../../game/contexts/world-context.js";
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
 * @typedef {import('../../services/interfaces.js').ILoggerService} ILoggerService
 */
export class QuestView extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {import('../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IHeroStateService} */
	@consume({ context: heroStateContext, subscribe: true })
	accessor heroState =
		/** @type {import('../../game/interfaces.js').IHeroStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../game/interfaces.js').IQuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../game/interfaces.js').IWorldStateService} */
	@consume({ context: worldStateContext, subscribe: true })
	accessor worldState =
		/** @type {import('../../game/interfaces.js').IWorldStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../services/session-service.js').SessionService} */
	@consume({ context: sessionContext, subscribe: true })
	accessor sessionService =
		/** @type {import('../../services/session-service.js').SessionService} */ (
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
