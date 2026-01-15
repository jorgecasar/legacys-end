/**
 * Service Interfaces - JSDoc Type Definitions
 *
 * This file defines interfaces for all major services in the application.
 * These interfaces serve as contracts that services must implement,
 * improving abstraction, documentation, and testability.
 */

// Import types from their source files
/** @typedef {import('./game-state-service.js').GameState} GameState */

/** @typedef {import('./game-state-service.js').HotSwitchState} HotSwitchState */

/** @typedef {import('./progress-service.js').ProgressState} ProgressState */
/** @typedef {import('./quest-registry-service.js').Quest} Quest */
/** @typedef {import('../config/game-configuration.js').AnimationConfig} AnimationConfig */
/** @typedef {import('../config/game-configuration.js').GameplayConfig} GameplayConfig */
/** @typedef {import('../config/game-configuration.js').StorageConfig} StorageConfig */
/** @typedef {import('../config/game-configuration.js').FeaturesConfig} FeaturesConfig */
/** @typedef {import('../config/game-configuration.js').ViewportConfig} ViewportConfig */
/** @typedef {import('../config/game-configuration.js').GameConfig} GameConfig */

/**
 * @typedef {Object} IGameStateService
 * @property {() => GameState} getState - Get current game state

 * @property {(x: number, y: number) => void} setHeroPosition - Update hero position
 * @property {(collected: boolean) => void} setCollectedItem - Set item collection status
 * @property {(collected: boolean) => void} setRewardCollected - Set reward collection status
 * @property {(state: HotSwitchState) => void} setHotSwitchState - Set API context state
 * @property {(paused: boolean) => void} setPaused - Set pause state
 * @property {(evolving: boolean) => void} setEvolving - Set evolution state
 * @property {(message: string|null) => void} setLockedMessage - Set locked message

 * @property {() => void} resetChapterState - Reset chapter-specific state
 * @property {(callback: (state: GameState, oldState: GameState) => void) => Function} subscribe - Subscribe to state changes
 */

/**
 * @typedef {Object} IProgressService
 * @property {() => ProgressState} getProgress - Get current progress
 * @property {() => void} saveProgress - Save progress to storage
 * @property {() => void} resetProgress - Reset all progress
 * @property {(questId: string) => void} resetQuestProgress - Reset specific quest
 * @property {(questId: string, chapterId: string) => void} setCurrentQuest - Set active quest/chapter
 * @property {(chapterId: string, state: Object) => void} setChapterState - Update chapter state
 * @property {(chapterId: string) => Object} getChapterState - Get chapter state
 * @property {(chapterId: string) => void} completeChapter - Mark chapter complete
 * @property {(questId: string) => void} completeQuest - Mark quest complete
 * @property {(questId: string) => void} unlockQuest - Unlock a quest
 * @property {(achievementId: string) => void} unlockAchievement - Unlock achievement
 * @property {(questId: string) => number} getQuestProgress - Get quest completion %
 * @property {() => number} getOverallProgress - Get overall completion %
 * @property {(questId: string) => boolean} isQuestCompleted - Check if quest done
 * @property {(questId: string) => boolean} isQuestAvailable - Check if quest available
 */

/**
 * @typedef {Object} IStorageAdapter
 * @property {(key: string) => any} getItem - Get item from storage
 * @property {(key: string, value: any) => void} setItem - Set item in storage
 * @property {(key: string) => void} removeItem - Remove item from storage
 * @property {() => void} clear - Clear all storage
 */

/**
 * @typedef {Object} IQuestController
 * @property {Object|null} currentQuest - Currently active quest
 * @property {Object|null} currentChapter - Currently active chapter
 * @property {number} currentChapterIndex - Index of current chapter
 * @property {(questId: string) => Promise<void>} startQuest - Start a new quest
 * @property {(questId: string) => Promise<void>} loadQuest - Load quest without reset
 * @property {() => Promise<void>} resumeQuest - Resume from saved state
 * @property {(questId: string) => Promise<void>} continueQuest - Continue from last chapter
 * @property {(chapterId: string) => boolean} jumpToChapter - Jump to specific chapter
 * @property {() => Object|null} getCurrentChapterData - Get current chapter data
 * @property {() => Object|null} getNextChapterData - Get next chapter data
 * @property {() => void} completeChapter - Complete current chapter
 * @property {() => boolean} hasNextChapter - Check if next chapter exists
 * @property {() => void} nextChapter - Move to next chapter
 * @property {() => void} completeQuest - Complete current quest
 * @property {() => void} returnToHub - Return to quest hub
 * @property {() => Quest[]} getAvailableQuests - Get available quests
 * @property {(questId: string) => number} getQuestProgress - Get quest progress %
 * @property {(questId: string) => boolean} isQuestCompleted - Check completion
 * @property {() => number} getOverallProgress - Get overall progress %
 * @property {() => void} resetProgress - Reset all progress
 */

/**
 * @typedef {Object} IEventBus
 * @property {(event: string, callback: Function) => () => void} on - Subscribe to event
 * @property {(event: string, callback: Function) => () => void} once - Subscribe once
 * @property {(event: string, callback: Function) => void} off - Unsubscribe
 * @property {(event: string, data?: any) => void} emit - Emit event
 * @property {(event?: string) => void} clear - Clear listeners
 * @property {(event: string) => number} listenerCount - Get listener count
 * @property {() => string[]} eventNames - Get all event names
 */

/**
 * @typedef {Object} IGameConfiguration
 * @property {string} env - Current environment
 * @property {AnimationConfig} animation - Animation settings
 * @property {GameplayConfig} gameplay - Gameplay settings
 * @property {StorageConfig} storage - Storage settings
 * @property {FeaturesConfig} features - Feature flags
 * @property {ViewportConfig} viewport - Viewport settings
 * @property {(path: string) => any} get - Get config value by path
 * @property {(feature: string) => boolean} isFeatureEnabled - Check if feature enabled
 * @property {() => GameConfig} getAll - Get all configuration
 */

// Export type definitions for use in other files
export {};
