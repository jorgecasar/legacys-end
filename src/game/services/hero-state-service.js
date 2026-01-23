import { Signal } from "@lit-labs/signals";

/** @typedef {import('../interfaces.js').HotSwitchState} HotSwitchState */
/** @typedef {import('../interfaces.js').IHeroStateService} IHeroStateService */

/**
 * HeroStateService - Manages hero-specific ephemeral state
 * @implements {IHeroStateService}
 */
export class HeroStateService {
	constructor() {
		this.pos = new Signal.State({ x: 50, y: 15 });
		this.hotSwitchState = new Signal.State(
			/** @type {HotSwitchState} */ (null),
		);
		this.isEvolving = new Signal.State(false);
		this.imageSrc = new Signal.State("");
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	setPos(x, y) {
		this.pos.set({ x, y });
	}

	/**
	 * @param {HotSwitchState} state
	 */
	setHotSwitchState(state) {
		this.hotSwitchState.set(state);
	}

	/**
	 * @param {boolean} evolving
	 */
	setIsEvolving(evolving) {
		this.isEvolving.set(evolving);
	}

	/**
	 * @param {string} src
	 */
	setImageSrc(src) {
		this.imageSrc.set(src ?? "");
	}
}
