/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 */

/**
 * @typedef {Object} CharacterContextState
 * @property {string} level
 * @property {import("../quests/quest-types.js").LevelConfig} [chapterData]
 * @property {string} [themeMode]
 * @property {string} [hotSwitchState]
 * @property {boolean} [hasCollectedItem]
 * @property {boolean} [isRewardCollected]
 * @property {import("../services/user-services.js").UserData} [userData]
 */

/**
 * @typedef {Object} CharacterContextOptions
 * @property {Object} [suitProvider]
 * @property {Object} [gearProvider]
 * @property {Object} [powerProvider]
 * @property {Object} [masteryProvider]
 * @property {Object} [characterProvider] - Combined provider if used
 * @property {function(): CharacterContextState} getState
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
	 * Update all character contexts based on current game state
	 */
	update() {
		const state = this.options.getState();

		// Calculate derived values
		const {
			level,
			chapterData,
			isRewardCollected,
			hasCollectedItem,
			hotSwitchState,
			themeMode,
		} = state;

		const suit = {
			image: chapterData?.hero
				? isRewardCollected
					? chapterData.hero.reward
					: chapterData.hero.image
				: null,
		};

		const gear = {
			image: hasCollectedItem && chapterData?.reward?.image
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
