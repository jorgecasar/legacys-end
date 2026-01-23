import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { questControllerContext } from "../../../contexts/quest-controller-context.js";
import { questStateContext } from "../../../game/contexts/quest-context.js";

import { gameExitZoneStyles } from "./GameExitZone.styles.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";

/**
 * @element game-exit-zone
 * @summary Displays the exit zone when available.
 * @property {Object} zoneConfig - The config object for the exit zone {x, y, width, height, label}.
 * @property {Boolean} active - Whether the exit zone is active (e.g. item collected).
 * @attribute active
 */
/**
 * @typedef {import('../../../content/quests/quest-types.js').Zone} Zone
 */

export class GameExitZone extends SignalWatcher(LitElement) {
	/** @type {import('../../../services/interfaces.js').IQuestController} */
	@consume({ context: questControllerContext, subscribe: true })
	accessor questController =
		/** @type {import('../../../services/interfaces.js').IQuestController} */ (
			/** @type {unknown} */ (null)
		);

	/** @type {import('../../../game/interfaces.js').IQuestStateService} */
	@consume({ context: questStateContext, subscribe: true })
	accessor questState =
		/** @type {import('../../../game/interfaces.js').IQuestStateService} */ (
			/** @type {unknown} */ (null)
		);

	/** @override */
	static styles = gameExitZoneStyles;

	/** @override */
	render() {
		const zoneConfig = this.questController?.currentChapter?.exitZone;
		const active = this.questState?.hasCollectedItem.get() || false;

		if (!active || !zoneConfig) return "";

		const { x, y, width, height, label } = zoneConfig;
		this.style.left = `${x}%`;
		this.style.top = `${y}%`;
		this.style.width = `${width}%`;
		this.style.height = `${height}%`;
		// Determine layout based on position relative to legacy/new zones
		const isRight = x > 50;
		const isLeft = x < 50;

		this.style.justifyContent = isRight
			? "flex-end"
			: isLeft
				? "flex-start"
				: "center";
		this.style.paddingRight = isRight ? "1rem" : "0";
		this.style.paddingLeft = isLeft ? "1rem" : "0";

		return html`
			<wa-tag size="small" variant="neutral" class="exit-text">${label || "EXIT"}</wa-tag>
		`;
	}
}
