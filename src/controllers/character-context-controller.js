/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 */

/**
 * @typedef {Object} CharacterContextState
 * @property {string} level
 * @property {import("../content/quests/quest-types.js").LevelConfig} [chapterData]
 * @property {string} [themeMode]
 * @property {string} [hotSwitchState]
 * @property {boolean} [hasCollectedItem]
 * @property {boolean} [isRewardCollected]
 * @property {import("../services/user-api-client.js").UserData} [userData]
 */

/**
 * @typedef {Object} CharacterContextOptions
 * @property {import('@lit/context').ContextProvider<any>} [characterProvider] - Combined provider if used
 * @property {import('../game/interfaces.js').IHeroStateService} heroState
 * @property {import('../game/interfaces.js').IQuestStateService} questState
 * @property {import('../controllers/quest-controller.js').QuestController} questController
 * @property {import('../services/theme-service.js').ThemeService} themeService
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
	/**
	 * @param {ReactiveControllerHost} host
	 * @param {CharacterContextOptions} options
	 */
	constructor(host, options) {
		this.host = host;
		this.options = options;

		host.addController(this);
	}

	/**
	 * Called when the host is connected to the DOM
	 */
	hostConnected() {
		// Initial setup if needed
	}

	/**
	 * Called before the host updates
	 * Update all character contexts based on current game state
	 */
	hostUpdate() {
		const { heroState, questState, questController } = this.options;
		if (!heroState || !questState || !questController) return;

		const currentChapter = questController.currentChapter;

		// Calculate derived values
		const level = currentChapter?.id || "";
		const chapterData = currentChapter;

		const isRewardCollected = questState.isRewardCollected?.get() || false;
		const hasCollectedItem = questState.hasCollectedItem?.get() || false;
		const hotSwitchState = heroState.hotSwitchState?.get() || "legacy";

		const themeMode = this.options.themeService?.themeMode?.get() || "light";

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
			effect: hotSwitchState === "new" ? "stable" : "glitch",
			intensity: themeMode === "dark" ? "high" : "low",
		};

		const mastery = {
			level: level,
		};

		// Update the single character provider
		if (this.options.characterProvider) {
			this.options.characterProvider.setValue({
				suit,
				gear,
				power,
				mastery,
			});
		}
	}
}
