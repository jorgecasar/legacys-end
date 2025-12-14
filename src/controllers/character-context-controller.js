/**
 * CharacterContextController - Manages character appearance contexts
 *
 * Handles:
 * - Suit/Skin images based on level and theme
 * - Gear images based on level
 * - Power images based on level
 *
 * Usage:
 * ```js
 * this.characterContexts = new CharacterContextController(this, {
 *   suitProvider: this.suitProvider,
 *   gearProvider: this.gearProvider,
 *   powerProvider: this.powerProvider,
 *   masteryProvider: this.masteryProvider,
 *   getState: () => ({
 *     level: this.level,
 *     chapterData: this.getChapterData(this.level),
 *     themeMode: this.themeMode,
 *     hotSwitchState: this.hotSwitchState,
 *     hasCollectedItem: this.hasCollectedItem,
 *     userData: this.userData,
 *     activeService: this.getActiveService()
 *   })
 * });
 *
 * // Update contexts when state changes
 * this.characterContexts.update();
 * ```
 */
export class CharacterContextController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = options;

		host.addController(this);
	}

	hostConnected() {
		// No setup needed
	}

	hostDisconnected() {
		// No cleanup needed
	}

	/**
	 * Update all character contexts based on current game state
	 */
	update() {
		const state = this.options.getState();

		this.updateSuitContext(state);
		this.updateGearContext(state);
		this.updatePowerContext(state);
		this.updateMasteryContext(state);
	}

	/**
	 * Update suit and skin images
	 */
	updateSuitContext(state) {
		if (!this.options.suitProvider) return;

		const { level, isRewardCollected } = state;
		if (!level) return;

		const baseUrl = `/assets/${level}`;
		// If reward is collected (evolution), show evolved hero, else standard hero
		const image = isRewardCollected
			? `${baseUrl}/hero-reward.png`
			: `${baseUrl}/hero.png`;

		this.options.suitProvider.setValue({ image });
	}

	/**
	 * Update gear images
	 */
	updateGearContext(state) {
		if (!this.options.gearProvider) return;

		const { level, hasCollectedItem } = state;
		if (!level) return;

		// If item is collected, show the reward item
		const image = hasCollectedItem ? `/assets/${level}/reward.png` : null;

		this.options.gearProvider.setValue({ image });
	}

	/**
	 * Update power images
	 */
	updatePowerContext(state) {
		if (!this.options.powerProvider) return;

		const { hotSwitchState, themeMode } = state;

		// Visual effect based on hot switch state or theme
		const effect = hotSwitchState === "new" ? "stable" : "glitch";
		const intensity = themeMode === "dark" ? "high" : "low";

		this.options.powerProvider.setValue({ effect, intensity });
	}

	/**
	 * Update mastery state
	 */
	updateMasteryContext(state) {
		if (!this.options.masteryProvider) return;

		// Pass through relevant mastery data if any
		this.options.masteryProvider.setValue({
			level: state.level
		});
	}
}
