/**
 * Service Interfaces - JSDoc Type Definitions
 *
 * This file defines interfaces for all major services in the application.
 * These interfaces serve as contracts that services must implement,
 * improving abstraction, documentation, and testability.
 */

// Import types from their source files

/** @typedef {import('./progress-service.js').ProgressState} ProgressState */
/** @typedef {import('../content/quests/quest-types.js').Quest} Quest */
/** @typedef {import('../content/quests/quest-types.js').Chapter} Chapter */
/** @typedef {import('../config/game-configuration.js').AnimationConfig} AnimationConfig */
/** @typedef {import('../config/game-configuration.js').GameplayConfig} GameplayConfig */
/** @typedef {import('../config/game-configuration.js').StorageConfig} StorageConfig */
/** @typedef {import('../config/game-configuration.js').ViewportConfig} ViewportConfig */
/** @typedef {import('../config/game-configuration.js').GameConfig} GameConfig */
/** @typedef {import('../config/game-configuration.js').FeaturesConfig} FeaturesConfig */
/** @typedef {import('../content/quests/quest-types.js').Difficulty} Difficulty */
/** @typedef {import('../content/quests/quest-types.js').QuestStatus} QuestStatus */
/** @typedef {import('../content/quests/quest-types.js').ZoneType} ZoneType */
/** @typedef {import('../content/quests/quest-types.js').ServiceBrand} ServiceBrand */
/**
 * @typedef {string | number | boolean | null | Object | Array<*>} JsonValue
 */

/**
 * @typedef {Object} AIDownloadProgressEvent
 * @property {number} loaded
 * @property {number} total
 */

/**
 * @typedef {Object} AIModelSession
 * @property {function(string): Promise<string>} prompt
 * @property {function(): void} destroy
 */

/**
 * @typedef {Object} AILanguageModel
 * @property {function(Object): Promise<AIModelSession>} create
 * @property {function(): Promise<string>} availability
 */

/**
 * @typedef {Object} IProgressService
 * @property {() => ProgressState} getProgress - Get current progress
 * @property {() => void} saveProgress - Save progress to storage
 * @property {() => void} resetProgress - Reset all progress
 * @property {(questId: string) => void} resetQuestProgress - Reset specific quest
 * @property {(questId: string|null, chapterId: string|null) => void} setCurrentQuest - Set active quest/chapter
 * @property {(chapterId: string, state: Record<string, JsonValue>) => void} setChapterState - Update chapter state
 * @property {(chapterId: string) => JsonValue} getChapterState - Get chapter state
 * @property {(chapterId: string) => void} completeChapter - Mark chapter complete
 * @property {(questId: string) => void} completeQuest - Mark quest complete
 * @property {(questId: string) => void} unlockQuest - Unlock a quest
 * @property {(achievementId: string | import('lit').TemplateResult) => void} unlockAchievement - Unlock achievement
 * @property {(questId: string) => number} getQuestProgress - Get quest completion %
 * @property {() => number} getOverallProgress - Get overall completion %
 * @property {(questId: string) => boolean} isQuestCompleted - Check if quest done
 * @property {(questId: string) => boolean} isQuestAvailable - Check if quest available
 * @property {(chapterId: string) => boolean} isChapterCompleted - Check if chapter done
 */

/**
 * @typedef {Object} IStorageAdapter
 * @property {(key: string) => JsonValue} getItem - Get item from storage
 * @property {(key: string, value: JsonValue) => void} setItem - Set item in storage
 * @property {(key: string) => void} removeItem - Remove item from storage
 * @property {() => void} clear - Clear all storage
 */

/**
 * @typedef {Chapter & { questId: string, index: number, total: number, isQuestComplete: boolean }} EnrichedChapter
 */

/**
 * @typedef {Object} IQuestController
 * @property {Quest|null} currentQuest - Currently active quest
 * @property {Chapter|null} currentChapter - Currently active chapter
 * @property {number} currentChapterIndex - Index of current chapter
 * @property {(questId: string) => Promise<QuestResult>} startQuest - Start a new quest
 * @property {(questId: string) => Promise<boolean>} loadQuest - Load quest without reset
 * @property {() => Promise<void>} resumeQuest - Resume from saved state
 * @property {(questId: string) => Promise<QuestResult>} continueQuest - Continue from last chapter
 * @property {(questId: string, chapterId: string) => Promise<void>} loadChapter - Load specific chapter
 * @property {(chapterId: string) => boolean} jumpToChapter - Jump to specific chapter
 * @property {() => EnrichedChapter|null} getCurrentChapterData - Get current chapter data
 * @property {() => void} completeChapter - Complete current chapter
 * @property {() => Promise<void>} advanceChapter - Advance to next chapter
 * @property {() => boolean} isLastChapter - Check if at last chapter
 * @property {() => boolean} hasNextChapter - Check if next chapter exists
 * @property {() => void} nextChapter - Move to next chapter
 * @property {() => void} completeQuest - Complete current quest
 * @property {(replace?: boolean) => Promise<{success: boolean, error?: Error}>} returnToHub - Return to quest hub
 * @property {() => Quest[]} getAvailableQuests - Get available quests
 * @property {() => Quest[]} getComingSoonQuests - Get coming soon quests
 * @property {(questId: string) => number} getQuestProgress - Get quest progress %
 * @property {(questId: string) => boolean} isQuestCompleted - Check completion
 * @property {() => void} resetProgress - Reset all progress
 * @property {() => void} handleRewardCollected - Handle reward collection event
 */

/**
 * @typedef {Object} IGameConfiguration
 * @property {string} env - Current environment
 * @property {AnimationConfig} animation - Animation settings
 * @property {GameplayConfig} gameplay - Gameplay settings
 * @property {StorageConfig} storage - Storage settings
 * @property {FeaturesConfig} features - Feature flags
 * @property {ViewportConfig} viewport - Viewport settings
 * @property {(path: string) => JsonValue | null} get - Get config value by path
 * @property {(feature: keyof FeaturesConfig) => boolean} isFeatureEnabled - Check if feature enabled
 * @property {() => GameConfig} getAll - Get all configuration
 */

/**
 * @typedef {Object} IThemeService
 * @property {import('./interfaces.js').ILoggerService | null} [logger]
 * @property {IStorageAdapter | null} [storage]
 * @property {import('@lit-labs/signals').State<import('./theme-service.js').ThemeMode>} themeMode
 * @property {(mode: import('./theme-service.js').ThemeMode) => void} setTheme
 * @property {() => void} toggleTheme
 */

/**
 * @typedef {Object} ILocalizationService
 * @property {import('./interfaces.js').ILoggerService | null} [logger]
 * @property {IStorageAdapter | null} [storage]
 * @property {(key: string) => string} t
 * @property {() => string} getLocale
 * @property {(locale: string) => Promise<void>} setLocale
 */

/**
 * @typedef {Object} IAIService
 * @property {string | null} [availabilityStatus]
 * @property {boolean} [isAvailable]
 * @property {Map<string, AIModelSession> | null} [sessions]
 * @property {import('@lit-labs/signals').State<boolean>} isEnabled
 * @property {() => Promise<string>} checkAvailability
 * @property {(key: string, options: import('./ai-service.js').AIOptions) => Promise<any>} createSession
 * @property {(key: string) => AIModelSession | null} getSession
 * @property {(key: string) => void} destroySession
 * @property {() => void} destroyAllSessions
 * @property {(key: string, prompt: string) => Promise<string>} getChatResponse
 */

/**
 * @typedef {Object} IVoiceSynthesisService
 * @property {SpeechSynthesis | null} [synthesis]
 * @property {SpeechSynthesisVoice[] | null} [voices]
 * @property {boolean} [isSpeaking]
 * @property {(text: string, options?: { lang?: string, voice?: SpeechSynthesisVoice | null, rate?: number, pitch?: number, queue?: boolean, onStart?: () => void, onEnd?: () => void, onError?: (e: unknown) => void }) => Promise<void>} speak
 * @property {() => void} cancel
 * @property {(lang: string, preferredNames?: string[]) => SpeechSynthesisVoice|null} getBestVoice
 */

/**
 * @typedef {Object} ISessionService
 * @property {import('@lit-labs/signals').State<boolean>} isLoading
 * @property {import('@lit-labs/signals').State<boolean>} isInHub
 * @property {import('@lit-labs/signals').State<Quest|null>} currentQuest
 * @property {(loading: boolean) => void} setLoading
 * @property {(inHub: boolean) => void} setIsInHub
 * @property {(quest: Quest|null) => void} setCurrentQuest
 */

/**
 * @typedef {import('../content/quests/quest-types.js').Quest | null} QuestOrNull
 */

/**
 * @typedef {Object} QuestResult
 * @property {boolean} success
 * @property {QuestOrNull} quest
 * @property {Error} [error]
 */

/**
 * @typedef {Object} IInteractionController
 * @property {() => void} handleInteract
 */

/**
 * @typedef {Record<string, JsonValue> | Error | undefined} LogMetadata
 */

/**
 * @typedef {Object} ILoggerService
 * @property {(message: string, meta?: LogMetadata) => void} debug
 * @property {(message: string, meta?: LogMetadata) => void} info
 * @property {(message: string, meta?: LogMetadata) => void} warn
 * @property {(message: string, error?: unknown) => void} error
 */

// Export type definitions for use in other files
export {};
