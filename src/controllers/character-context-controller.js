import { ContextConsumer } from "@lit/context";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { gameStoreContext } from "../core/store.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../types/services.d.js').IQuestController} IQuestController
 * @typedef {import('../types/services.d.js').IThemeService} IThemeService
 * @typedef {import('../contexts/character-context.js').CharacterContext} CharacterContext
 * @typedef {import("@lit/context").ContextProvider<import('@lit/context').Context<symbol, CharacterContext>, ReactiveElement>} CharacterContextProvider
 */

/**
 * @typedef {ReactiveElement & { character: CharacterContext }} HostWithCharacterProvider
 */

/**
 * CharacterContextController - Manages character appearance contexts
 *
 * Handles:
 * - Suit/Skin images based on level and theme
 *
 * @implements {ReactiveController}
 */
export class CharacterContextController {
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestStateService | null} */
	#questState = null;
	/** @type {IQuestController | null} */
	#questController = null;

	/**
	 * @param {HostWithCharacterProvider} host
	 */
	constructor(host) {
		this.host = host;

		// Initialize Context Consumers
		new ContextConsumer(this.host, {
			context: gameStoreContext,
			subscribe: true,
			callback: (store) => {
				if (store) {
					this.#heroState = store.hero;
					this.#questState = store.quest;
				}
			},
		});

		new ContextConsumer(this.host, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = service;
			},
		});

		host.addController(this);
	}

	/**
	 * Called before the host updates
	 * Update all character contexts based on current game state
	 */
	hostUpdate() {
		if (!this.#heroState || !this.#questState || !this.#questController) return;

		const host = /** @type {HostWithCharacterProvider} */ (
			/** @type {unknown} */ (this.host)
		);

		if (!host.character) return;

		const currentChapter = this.#questController.currentChapter;

		const chapterData = currentChapter;

		const isRewardCollected =
			this.#questState.isRewardCollected?.get() ?? false;

		const suit = {
			image: chapterData?.hero
				? isRewardCollected
					? chapterData.hero.reward
					: chapterData.hero.image
				: null,
		};

		host.character = {
			suit,
		};
	}
}
