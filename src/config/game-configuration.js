/**
 * Game Configuration Service
 *
 * Centralizes all game configuration in one place with:
 * - Environment-aware defaults
 * - Type-safe access
 * - Validation
 * - Easy testing (inject different configs)
 */

import { StorageKeys } from "../core/constants.js";

/**
 * @typedef {'development' | 'production' | 'test'} Environment
 */

/**
 * @typedef {Object} AnimationConfig
 * @property {number} rewardDuration - Duration of reward collection animation (ms)
 * @property {number} transitionDuration - Duration of level transition animation (ms)
 * @property {number} evolutionDuration - Duration of evolution animation (ms)
 */

/**
 * @typedef {Object} GameplayConfig
 * @property {number} interactionDistance - Distance threshold for NPC interaction
 * @property {number} heroSpeed - Hero movement speed
 * @property {number} collisionPadding - Padding for collision detection
 */

/**
 * @typedef {Object} StorageConfig
 * @property {string} progressKey - LocalStorage key for progress
 * @property {string} version - Storage version for migrations
 */

/**
 * @typedef {Object} FeaturesConfig
 * @property {boolean} voiceControl - Enable voice control
 * @property {boolean} aiAssistant - Enable AI assistant
 * @property {boolean} debugMode - Enable debug features
 */

/**
 * @typedef {Object} ViewportConfig
 * @property {Object} zones - Zone definitions
 * @property {Object} zones.theme - Theme zone boundaries
 * @property {number} zones.theme.darkThreshold - Y threshold for dark theme
 * @property {Object} zones.context - Context zone boundaries
 * @property {number} zones.context.legacyX - X threshold for legacy context
 * @property {number} zones.context.newX - X threshold for new context
 */

/**
 * @typedef {Object} GameConfig
 * @property {Environment} env - Current environment
 * @property {AnimationConfig} animation - Animation settings
 * @property {GameplayConfig} gameplay - Gameplay settings
 * @property {StorageConfig} storage - Storage settings
 * @property {FeaturesConfig} features - Feature flags
 * @property {ViewportConfig} viewport - Viewport settings
 */

export class GameConfiguration {
	/**
	 * @param {Environment} [env] - Environment (defaults to import.meta.env.MODE)
	 * @param {Partial<GameConfig>} [overrides] - Config overrides for testing
	 */
	constructor(env, overrides = {}) {
		this.env = /** @type {Environment} */ (
			env || import.meta.env.MODE || "production"
		);
		/** @type {GameConfig} */
		this._config = this._loadConfig();

		// Apply overrides (useful for testing)
		if (overrides) {
			this._config = /** @type {GameConfig} */ (
				this._deepMerge(this._config, overrides)
			);
		}

		this._validate();
	}

	/**
	 * Load configuration based on environment
	 * @private
	 * @returns {GameConfig}
	 */
	_loadConfig() {
		const isDev = this.env === "development";
		const isTest = this.env === "test";

		return {
			env: this.env,

			animation: {
				// Faster animations in test/dev for quicker feedback
				rewardDuration: isTest ? 100 : isDev ? 1000 : 2000,
				transitionDuration: isTest ? 100 : isDev ? 750 : 1500,
				evolutionDuration: isTest ? 100 : isDev ? 1000 : 2000,
			},

			gameplay: {
				interactionDistance: 15,
				heroSpeed: 5,
				collisionPadding: 2,
			},

			storage: {
				progressKey: StorageKeys.PROGRESS,
				version: "1.0.0",
			},

			features: {
				// Disable heavy features in test environment
				voiceControl: !isTest,
				aiAssistant: !isTest,
				debugMode: isDev || isTest,
			},

			viewport: {
				zones: {
					theme: {
						darkThreshold: 50, // Y > 50 = dark theme
					},
					context: {
						legacyX: 50, // X < 50 = legacy
						newX: 50, // X > 50 = new
					},
				},
			},
		};
	}

	/**
	 * Validate configuration
	 * @private
	 * @throws {Error} If configuration is invalid
	 */
	_validate() {
		const { animation, gameplay, storage } = this._config;

		// Validate animation durations
		if (animation.rewardDuration < 0) {
			throw new Error("Reward duration must be positive");
		}
		if (animation.transitionDuration < 0) {
			throw new Error("Transition duration must be positive");
		}

		// Validate gameplay settings
		if (gameplay.interactionDistance < 0) {
			throw new Error("Interaction distance must be positive");
		}
		if (gameplay.heroSpeed <= 0) {
			throw new Error("Hero speed must be positive");
		}

		// Validate storage
		if (!storage.progressKey || storage.progressKey.trim().length === 0) {
			throw new Error("Storage key cannot be empty");
		}
	}

	/**
	 * Deep merge two objects
	 * @param {Record<string, unknown>} target
	 * @param {Record<string, unknown>} source
	 * @returns {Record<string, unknown>}
	 * @private
	 */
	_deepMerge(target, source) {
		const output = { ...target };
		for (const key in source) {
			if (
				source[key] &&
				typeof source[key] === "object" &&
				!Array.isArray(source[key])
			) {
				output[key] = this._deepMerge(
					/** @type {Record<string, unknown>} */ (
						/** @type {unknown} */ (target[key] || {})
					),
					/** @type {Record<string, unknown>} */ (
						/** @type {unknown} */ (source[key])
					),
				);
			} else {
				output[key] = source[key];
			}
		}
		return output;
	}

	/**
	 * Get configuration value by path
	 * @param {string} path - Dot-separated path (e.g., 'animation.rewardDuration')
	 * @returns {unknown}
	 */
	get(path) {
		return path
			.split(".")
			.reduce(
				(obj, key) =>
					obj ? /** @type {Record<string, unknown>} */ (obj)[key] : undefined,
				/** @type {unknown} */ (this._config),
			);
	}

	/**
	 * Get animation configuration
	 * @returns {AnimationConfig}
	 */
	get animation() {
		return this._config.animation;
	}

	/**
	 * Get gameplay configuration
	 * @returns {GameplayConfig}
	 */
	get gameplay() {
		return this._config.gameplay;
	}

	/**
	 * Get storage configuration
	 * @returns {StorageConfig}
	 */
	get storage() {
		return this._config.storage;
	}

	/**
	 * Get features configuration
	 * @returns {FeaturesConfig}
	 */
	get features() {
		return this._config.features;
	}

	/**
	 * Get viewport configuration
	 * @returns {ViewportConfig}
	 */
	get viewport() {
		return this._config.viewport;
	}

	/**
	 * Check if a feature is enabled
	 * @param {keyof FeaturesConfig} feature
	 * @returns {boolean}
	 */
	isFeatureEnabled(feature) {
		return this._config.features[feature] === true;
	}

	/**
	 * Get full configuration (for debugging)
	 * @returns {GameConfig}
	 */
	getAll() {
		return { ...this._config };
	}
}

// Export singleton instance
export const gameConfig = new GameConfiguration();
