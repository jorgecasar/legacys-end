/**
 * Application and Game Configuration Types
 */

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

/**
 * @typedef {Object} IGameConfiguration
 * @property {Environment} env - Current environment
 * @property {AnimationConfig} animation - Animation settings
 * @property {GameplayConfig} gameplay - Gameplay settings
 * @property {StorageConfig} storage - Storage settings
 * @property {FeaturesConfig} features - Feature flags
 * @property {ViewportConfig} viewport - Viewport settings
 * @property {(path: string) => import('./common.d.js').JsonValue | null} get - Get config value by path
 * @property {(feature: keyof FeaturesConfig) => boolean} isFeatureEnabled - Check if feature enabled
 * @property {() => GameConfig} getAll - Get all configuration
 */

export {};
