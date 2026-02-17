import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { consume } from "@lit/context";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { loggerContext } from "../../contexts/logger-context.js";
import { questControllerContext } from "../../contexts/quest-controller-context.js";
import { sessionContext } from "../../contexts/session-context.js";
import { gameStoreContext } from "../../state/game-store.js";
import { pauseMenuStyles } from "./PauseMenu.styles.js";

/**
 * @element pause-menu
 * @extends {LitElement}
 * @typedef {import('../../types/services.d.js').ILoggerService} ILoggerService
 * @typedef {import('../../types/game.d.js').IWorldStateService} IWorldStateService
 * @typedef {import('../../types/services.d.js').IQuestController} IQuestController
 */
export class PauseMenu extends SignalWatcher(
	/** @type {new (...args: unknown[]) => import('lit').ReactiveElement} */ (
		LitElement
	),
) {
	/** @type {import('../../state/game-store.js').GameStore} */
	@consume({ context: gameStoreContext, subscribe: true })
	accessor gameStore =
		/** @type {import('../../state/game-store.js').GameStore} */ (
			/** @type {unknown} */ (null)
		);

	get worldState() {
		return this.gameStore?.world;
	}

	/** @type {IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController = /** @type {IQuestController} */ (
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
	static styles = pauseMenuStyles;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	/** @override */
	render() {
		const open = this.worldState?.isPaused.get() || false;

		return html`
			<wa-dialog 
				label="${msg("PAUSED")}" 
				?open="${open}"
				style="--width: 320px;"
				@wa-request-close="${this.handleRequestClose}"
			>
				<div class="menu-buttons">
					<wa-button variant="brand" class="menu-btn" @click="${this.resume}">
						<wa-icon slot="start" name="play"></wa-icon> ${msg("RESUME GAME")}
					</wa-button>
					
					<wa-button variant="neutral" class="menu-btn" @click="${this.restart}">
						<wa-icon slot="start" name="rotate-left"></wa-icon> ${msg("RESTART QUEST")}
					</wa-button>
					
					<wa-button variant="danger" class="menu-btn" @click="${this.quit}">
						<wa-icon slot="start" name="door-open"></wa-icon> ${msg("RETURN TO HUB")}
					</wa-button>
				</div>
			</wa-dialog>
		`;
	}

	/**
	 * @param {CustomEvent} event
	 */
	handleRequestClose(event) {
		// Only allow closing via Resume button or external logic (which updates .open)
		// If the user clicks overlay or escape, we treat it as "Resume"
		if (
			event.detail.source === "overlay" ||
			event.detail.source === "keyboard"
		) {
			this.resume();
		}
	}

	resume() {
		this.worldState?.setPaused(false);
	}

	restart() {
		const currentQuest = this.sessionService?.currentQuest.get();
		this.worldState?.setPaused(false);
		if (currentQuest) {
			this.questController?.startQuest(currentQuest.id);
		}
	}

	quit() {
		this.worldState?.setPaused(false);
		this.questController?.returnToHub();
	}
}
