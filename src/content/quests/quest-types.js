/**
 * Quest Type Definitions
 *
 * Separated from quest-registry to avoid circular dependencies
 */

/**
 * @typedef {import("../../core/constants.js").ZoneType} ZoneType
 */

/**
 * Quest Status
 * @readonly
 * @enum {string}
 */
export const QuestStatus = {
	AVAILABLE: "available",
	COMING_SOON: "coming_soon",
	LOCKED: "locked",
};

/**
 * Difficulty Levels
 * @readonly
 * @enum {string}
 */
export const Difficulty = {
	BEGINNER: "beginner",
	INTERMEDIATE: "intermediate",
	ADVANCED: "advanced",
	EXPERT: "expert",
};

/**
 * Service Brands
 * @readonly
 * @enum {string}
 */
export const ServiceBrand = {
	LEGACY: "Legacy API",
	MOCK: "Mock Service",
	NEW: "New V2 API",
};

/**
 * Maps HotSwitchStates to their corresponding ServiceBrand display names.
 * @type {Record<string, ServiceBrand>}
 */
export const ServiceBrandMap = {
	legacy: ServiceBrand.LEGACY,
	new: ServiceBrand.NEW,
	mock: ServiceBrand.MOCK,
};

/**
 * @typedef {Object} Vector2
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Size
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Vector2 & Size} Rect
 */

/**
 * @typedef {Rect & { label?: string, type?: ZoneType, payload?: import('../../services/interfaces.js').JsonValue, requiresItem?: boolean }} Zone
 */

/**
 * @typedef {Object} RenderableConfig
 * @property {string} [name]
 * @property {string} image - The display image (required)
 * @property {string} [icon] - Optional icon (deprecated for rewards)
 */

/**
 * @typedef {RenderableConfig & { position: Vector2 }} PlacedConfig
 */

/**
 * @typedef {RenderableConfig & { reward?: string }} HeroConfig
 */

/**
 * @typedef {PlacedConfig & { name: string }} RewardConfig
 */

/**
 * @typedef {PlacedConfig & { name: string, requirements?: Record<string, { value: import('../../services/interfaces.js').JsonValue, message: string }> }} NpcConfig
 */

/**
 * @typedef {Object} CodeSnippet
 * @property {string} title
 * @property {string} code
 * @property {string} [language]
 */

/**
 * @typedef {Object} CodeSnippetsConfig
 * @property {CodeSnippet[]} [start]
 * @property {CodeSnippet[]} [end]
 */

/**
 * @typedef {Object} GameStats
 * @property {number} maintainability
 * @property {number} portability
 */

/**
 * @typedef {Object} LevelConfig
 * @property {string} id
 * @property {number} [powerLevel]
 * @property {string} title
 * @property {string} description
 * @property {string} problemTitle
 * @property {string | import('lit').TemplateResult} problemDesc
 * @property {string} [solutionTitle]
 * @property {string} [solutionDesc]
 * @property {string[]} [architecturalChanges]
 * @property {CodeSnippetsConfig} [codeSnippets]
 * @property {GameStats} [stats]
 * @property {ServiceBrand | null} [serviceType]
 * @property {Vector2} startPos
 * @property {Zone} [exitZone]
 * @property {string} [backgroundStyle]
 * @property {string} [backgroundStyleReward]
 * @property {string} [background]
 * @property {NpcConfig} [npc]
 * @property {RewardConfig} [reward]
 * @property {HeroConfig} [hero]
 * @property {Zone[]} [zones]
 * @property {Rect[]} [obstacles]
 */

/**
 * @typedef {Object} QuestData
 * @property {string} id
 * @property {string} name
 * @property {string} [subtitle]
 * @property {string} description
 * @property {string} icon
 * @property {Difficulty} difficulty
 * @property {string} [estimatedTime]
 * @property {string} [color]
 * @property {string} [legacyProblem]
 * @property {string} [levels]
 * @property {string[]} [prerequisites]
 * @property {string[]} [shortcuts]
 * @property {string[]} [concepts]
 * @property {string[]} [chapterIds]
 * @property {Record<string, Chapter>} [chapters]
 * @property {QuestStatus} [status]
 * @property {{ badge: string; ability: string; description?: string; }} [reward]
 */

/**
 * @typedef {Object} QuestProgress
 * @property {boolean} [isCompleted]
 * @property {boolean} [isLocked]
 * @property {number} [progress]
 * @property {boolean} [inProgress]
 */

/**
 * @typedef {QuestData & QuestProgress} Quest
 */

/**
 * @typedef {LevelConfig} Chapter
 */
