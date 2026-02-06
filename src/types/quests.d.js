/**
 * @typedef {import('./common.d.js').JSONSerializable} JSONSerializable
 * @typedef {import('./common.d.js').Vector2} Vector2
 * @typedef {import('./common.d.js').Size} Size
 * @typedef {import('./common.d.js').Rect} Rect
 * @typedef {typeof import('../core/constants.js').ZoneTypes[keyof typeof import('../core/constants.js').ZoneTypes]} ZoneType
 * @typedef {typeof import('../core/constants.js').ServiceType[keyof typeof import('../core/constants.js').ServiceType]} ServiceType
 * @typedef {typeof import('../core/constants.js').Difficulty[keyof typeof import('../core/constants.js').Difficulty]} Difficulty
 * @typedef {typeof import('../core/constants.js').QuestStatus[keyof typeof import('../core/constants.js').QuestStatus]} QuestStatus
 */

/**
 * Interactive Zone definition.
 * Represents a specific area in a level that triggers actions or contains content.
 * @typedef {Rect & { label?: string, type?: ZoneType, payload?: JSONSerializable, requiresItem?: boolean }} Zone
 */

/**
 * Base configuration for any renderable entity in the quest view.
 * @typedef {Object} RenderableConfig
 * @property {string} [name] - Optional display name.
 * @property {string} image - The asset path for the main image/sprite.
 * @property {string} [icon] - Optional icon asset path (e.g., for minimap or UI).
 */

/**
 * Configuration for an entity placed at a specific position.
 * @typedef {RenderableConfig & { position: Vector2 }} PlacedConfig
 */

/**
 * Configuration for the Hero character in a specific level.
 * @typedef {RenderableConfig & { reward?: string }} HeroConfig
 */

/**
 * Configuration for a collectable reward in the level.
 * @typedef {PlacedConfig & { name: string }} RewardConfig
 */

/**
 * Configuration for a Non-Player Character (NPC).
 * Can define requirements (items/values) to interact.
 * @typedef {PlacedConfig & { name: string, requirements?: Record<string, { value: JSONSerializable, message: string }> }} NpcConfig
 */

/**
 * A snippet of code to be displayed or used in a coding challenge.
 * @typedef {Object} CodeSnippet
 * @property {string} title - The title or filename of the snippet.
 * @property {string} code - The actual code content.
 * @property {string} [language] - Programming language for syntax highlighting (e.g., 'javascript', 'html').
 */

/**
 * Configuration for code snippets shown at the start or end of a level/chapter.
 * @typedef {Object} CodeSnippetsConfig
 * @property {CodeSnippet[]} [start] - Snippets shown when entering the level.
 * @property {CodeSnippet[]} [end] - Snippets shown upon completion.
 */

/**
 * Configuration for a single Level or Chapter within a Quest.
 * Defines the environment, challenges, and narrative content.
 * @typedef {Object} LevelConfig
 * @property {string} id - Unique identifier for the chapter.
 * @property {string} title - Display title of the chapter.
 * @property {string} description - Brief description of the chapter's goal.
 * @property {string} problemTitle - Title of the problem being solved.
 * @property {string | import('lit').TemplateResult} problemDesc - Detailed description of the problem.
 * @property {string} [solutionTitle] - Title of the solution explanation.
 * @property {string} [solutionDesc] - Detailed explanation of the solution.
 * @property {string[]} [architecturalChanges] - List of architectural improvements introduced.
 * @property {CodeSnippetsConfig} [codeSnippets] - Code snippets related to the chapter.
 * @property {import('./common.d.js').JSONSerializable} [stats] - Stats modifiers applied in this chapter.
 * @property {ServiceType | null} [serviceType] - The service associated with this chapter (if any).
 * @property {Vector2} startPos - Starting position of the hero.
 * @property {Zone} [exitZone] - The zone that triggers level completion.
 * @property {string} [backgroundStyle] - CSS style/class for the background.
 * @property {string} [backgroundStyleReward] - CSS style/class for the reward phase background.
 * @property {string} [background] - Background image asset path.
 * @property {NpcConfig} [npc] - NPC configuration for this level.
 * @property {RewardConfig} [reward] - Reward configuration for this level.
 * @property {HeroConfig} [hero] - Hero override configuration.
 * @property {Zone[]} [zones] - List of interactive zones in the level.
 * @property {Rect[]} [obstacles] - List of collision obstacles.
 */

/**
 * Metadata defining the high-level properties of a Quest.
 * Used for listing quests in the Hub.
 * @typedef {Object} QuestMetadata
 * @property {string} id - Unique Quest ID.
 * @property {import('lit').TemplateResult | string} name - Display name of the quest.
 * @property {import('lit').TemplateResult | string} [subtitle] - Optional subtitle.
 * @property {import('lit').TemplateResult | string} description - Brief description.
 * @property {string} icon - Icon asset path.
 * @property {Difficulty} difficulty - Difficulty level (e.g., BEGINNER, ADVANCED).
 * @property {import('lit').TemplateResult | string} [estimatedTime] - Estimated completion time.
 * @property {QuestStatus} [status] - Current status (LOCKED, AVAILABLE, COMPLETED).
 * @property {string[]} [prerequisites] - IDs of required quests.
 */

/**
 * Full Quest Data structure.
 * Includes metadata plus all content, chapters, and rewards.
 * @typedef {QuestMetadata & {
 *  color?: string,
 *  legacyProblem?: import('lit').TemplateResult | string,
 *  levels?: import('lit').TemplateResult | string,
 *  shortcuts?: string[],
 *  concepts?: (import('lit').TemplateResult | string)[],
 *  chapterIds?: string[],
 *  chapters?: Record<string, Chapter>,
 *  reward?: { badge: import('lit').TemplateResult | string; ability: import('lit').TemplateResult | string; description?: import('lit').TemplateResult | string; }
 * }} QuestData
 */

/**
 * Runtime progress state of a Quest.
 * @typedef {Object} QuestProgress
 * @property {boolean} [isCompleted] - True if the quest is fully finished.
 * @property {boolean} [isLocked] - True if the quest is locked/unavailable.
 * @property {number} [progress] - Percentage completion (0-100).
 * @property {boolean} [inProgress] - True if the quest has been started but not finished.
 */

/**
 * Combined Quest Type.
 * Merges static data and dynamic progress.
 * @typedef {QuestData & QuestProgress} Quest
 */

/**
 * Alias for LevelConfig.
 * @typedef {LevelConfig} Chapter
 */

/**
 * Enriched Chapter Data.
 * Includes derived runtime information like index and completion status.
 * @typedef {Chapter & { questId: string, index: number, total: number, isQuestComplete: boolean }} EnrichedChapter
 */

/**
 * Result of a quest/chapter operation.
 * @typedef {Object} QuestResult
 * @property {boolean} success - Whether the operation succeeded.
 * @property {Quest | null} quest - The affected quest object.
 * @property {Error} [error] - Error details if failed.
 */

export {};
