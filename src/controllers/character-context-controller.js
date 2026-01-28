import { ContextConsumer } from "@lit/context";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { themeContext } from "../contexts/theme-context.js";
import { HotSwitchStates, ThemeModes } from "../core/constants.js";
import { heroStateContext } from "../game/contexts/hero-context.js";
import { questStateContext } from "../game/contexts/quest-context.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 * @typedef {import('../game/interfaces.js').IHeroStateService} IHeroStateService
 * @typedef {import('../game/interfaces.js').IQuestStateService} IQuestStateService
 * @typedef {import('../services/interfaces.js').IQuestController} IQuestController
 * @typedef {import('../services/interfaces.js').IThemeService} IThemeService
 * @typedef {import('../contexts/character-context.js').CharacterContext} CharacterContext
 * @typedef {import("@lit/context").ContextProvider<import('@lit/context').Context<symbol, CharacterContext>, ReactiveElement>} CharacterContextProvider
 */

/**
 * @typedef {ReactiveElement & { characterProvider: CharacterContextProvider | null }} HostWithCharacterProvider
 */

/**
 * CharacterContextController - Manages character appearance contexts
 *
 * Handles:
 * - Suit/Skin images based on level and theme
 * - Gear images based on level
 * - Power images based on level
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
	/** @type {IThemeService | null} */
	#themeService = null;

	/**
	 * @param {HostWithCharacterProvider} host
	 */
	constructor(host) {
		this.host = host;

		// Initialize Context Consumers
		new ContextConsumer(this.host, {
			context: heroStateContext,
			subscribe: true,
			callback: (service) => {
				this.#heroState = service;
			},
		});

		new ContextConsumer(this.host, {
			context: questStateContext,
			subscribe: true,
			callback: (service) => {
				this.#questState = service;
			},
		});

		new ContextConsumer(this.host, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = service;
			},
		});

		new ContextConsumer(this.host, {
			context: themeContext,
			subscribe: true,
			callback: (service) => {
				this.#themeService = service;
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

		if (!host.characterProvider) return;

		const currentChapter = this.#questController.currentChapter;

		// Calculate derived values
		const level = currentChapter?.id ?? "";
		const levelNumber = parseInt(level, 10) || 0;
		const chapterData = currentChapter;

		const isRewardCollected =
			this.#questState.isRewardCollected?.get() ?? false;
		const hasCollectedItem = this.#questState.hasCollectedItem?.get() ?? false;
		const hotSwitchState =
			this.#heroState.hotSwitchState?.get() ?? HotSwitchStates.LEGACY;

		const themeMode = this.#themeService?.themeMode?.get() ?? ThemeModes.LIGHT;

		const suit = {
			image: chapterData?.hero
				? isRewardCollected
					? chapterData.hero.reward
					: chapterData.hero.image
				: null,
		};

		const gear = {
			image:
				hasCollectedItem && chapterData?.reward?.image
					? chapterData.reward.image
					: null,
		};

		const power = {
			effect: hotSwitchState === HotSwitchStates.NEW ? "stable" : "glitch",
			intensity: themeMode === ThemeModes.DARK ? "high" : "low",
		};

		const mastery = {
			level: levelNumber,
		};

		// Update the single character provider
		host.characterProvider.setValue({
			suit,
			gear,
			power,
			mastery,
		});
	}
}
