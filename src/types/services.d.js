/** @typedef {import('./common.d.js').JSONSerializable} JSONSerializable */

/**
 * @typedef {import('./common.d.js').JsonValue} JsonValue
 * @typedef {import('./quests.d.js').Quest} Quest
 * @typedef {import('./quests.d.js').Chapter} Chapter
 * @typedef {import('./quests.d.js').EnrichedChapter} EnrichedChapter
 * @typedef {import('./quests.d.js').QuestResult} QuestResult
 */

/**
 * @typedef {typeof import('../core/constants.js').ThemeModes[keyof typeof import('../core/constants.js').ThemeModes]} ThemeMode
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
 * Progress Service Interface
 * Manages persistent user progress, including completed quests, chapters, and unlocked content.
 * @typedef {Object} IProgressService
 * @property {() => import('../services/progress-service.js').ProgressState} getProgress - Retrieves the full progress state tree.
 * @property {() => void} saveProgress - Persists current progress to storage.
 * @property {() => void} resetProgress - Wipes all progress data (Dangerous).
 * @property {(questId: string) => void} resetQuestProgress - Resets progress for a specific quest only.
 * @property {(questId: string|null, chapterId: string|null) => void} setCurrentQuest - Sets the actively tracked quest.
 * @property {(chapterId: string, state: Record<string, JSONSerializable>) => void} setChapterState - Updates persistent state for a chapter.
 * @property {(chapterId: string) => JSONSerializable} getChapterState - Retrieves persistent state for a chapter.
 * @property {(chapterId: string) => void} completeChapter - Marks a chapter as completed.
 * @property {(questId: string) => void} completeQuest - Marks a quest as completed.
 * @property {(questId: string) => void} unlockQuest - Unlocks a quest for play.
 * @property {(achievementId: string | import('lit').TemplateResult) => void} unlockAchievement - Unlocks an achievement.
 * @property {(questId: string) => number} getQuestProgress - Calculates completion percentage for a quest.
 * @property {() => number} getOverallProgress - Calculates overall game completion percentage.
 * @property {(questId: string) => boolean} isQuestCompleted - Checks if a quest is finished.
 * @property {(questId: string) => boolean} isQuestAvailable - Checks if a quest is unlocked and prerequisites met.
 * @property {(chapterId: string) => boolean} isChapterCompleted - Checks if a chapter is finished.
 * @property {<K extends keyof import('../services/progress-service.js').ProgressState>(key: K) => import('../services/progress-service.js').ProgressState[K]} getProperty - Retrieves a specific property from the progress state.
 * @property {ILoggerService | undefined} logger - Optional logger service.
 */

/**
 * Storage Adapter Interface
 * Abstract interface for data persistence (e.g., LocalStorage, IndexedDB).
 * @typedef {Object} IStorageAdapter
 * @property {(key: string) => JSONSerializable | null} getItem - Retrieves a value by key.
 * @property {(key: string, value: JSONSerializable) => void} setItem - Stores a value by key.
 * @property {(key: string) => void} removeItem - Deletes a value by key.
 * @property {() => void} clear - Wipes all stored data.
 */

/**
 * Quest Controller Interface
 * Orchestrates quest flow, logic, and navigation.
 * Functions as the bridge between UI, State, and Game Logic.
 * @typedef {Object} IQuestController
 * @property {Quest|null} currentQuest - Currently active quest object.
 * @property {Chapter|null} currentChapter - Currently active chapter configuration.
 * @property {number} currentChapterIndex - Index of the current chapter in the sequence.
 * @property {(questId: string) => Promise<QuestResult>} startQuest - Initializes and starts a quest.
 * @property {(questId: string) => Promise<boolean>} loadQuest - Loads a quest's data without resetting state.
 * @property {() => Promise<void>} resumeQuest - Resumes the last active quest from saved state.
 * @property {(questId: string) => Promise<QuestResult>} continueQuest - Continues a specific quest from where it left off.
 * @property {(questId: string, chapterId: string) => Promise<void>} loadChapter - Loads a specific chapter within a quest.
 * @property {(chapterId: string) => boolean} jumpToChapter - Jumps to a specific chapter by ID (navigation).
 * @property {() => EnrichedChapter|null} getCurrentChapterData - returns the current chapter with enriched runtime types.
 * @property {() => void} completeChapter - Logic to handle chapter completion (events, progress update).
 * @property {() => Promise<void>} advanceChapter - Moves to the next chapter in the sequence.
 * @property {() => boolean} isLastChapter - Checks if this is the final chapter.
 * @property {() => boolean} hasNextChapter - Checks if there is a subsequent chapter.
 * @property {() => void} nextChapter - Alias for advanceChapter (deprecated?).
 * @property {() => void} completeQuest - Logic to handle full quest completion.
 * @property {(replace?: boolean) => Promise<{success: boolean, error?: Error}>} returnToHub - Navigates back to the Quest Hub.
 * @property {() => Quest[]} getAvailableQuests - Returns list of all unlocked quests.
 * @property {() => Quest[]} getComingSoonQuests - Returns list of quests not yet implemented.
 * @property {(questId: string) => number} getQuestProgress - Returns cached progress for a quest type.
 * @property {(questId: string) => boolean} isQuestCompleted - Checks if a quest type is completed.
 * @property {() => void} resetProgress - Resets all progress via the progress service.
 * @property {() => void} handleRewardCollected - Triggers events when a reward is collected.
 */

/**
 * Theme Service Interface
 * Manages application theming (Light/Dark mode) and persistence.
 * @typedef {Object} IThemeService
 * @property {ILoggerService | null} [logger] - Optional logger dependency.
 * @property {IStorageAdapter | null} [storage] - Optional storage dependency.
 * @property {import('@lit-labs/signals').State<ThemeMode>} themeMode - Reactive signal for current theme mode.
 * @property {(mode: ThemeMode) => void} setTheme - Explicitly sets the theme.
 * @property {() => void} toggleTheme - Toggles between 'light' and 'dark'.
 */

/**
 * Localization Service Interface
 * Manages i18n, translations, and locale switching.
 * @typedef {Object} ILocalizationService
 * @property {ILoggerService | null} [logger] - Optional logger dependency.
 * @property {IStorageAdapter | null} [storage] - Optional storage dependency.
 * @property {(key: string) => string} t - Translates a key to the current locale.
 * @property {() => string} getLocale - Returns the current locale code (e.g., 'en', 'es').
 * @property {(locale: string) => Promise<void>} setLocale - Changes the application locale.
 */

/**
 * Logger Service Interface
 * Unified logging interface for application-wide observability.
 * @typedef {Object} ILoggerService
 * @property {(message: string, meta?: Record<string, JSONSerializable> | Error) => void} debug - Log debug info (dev only).
 * @property {(message: string, meta?: Record<string, JSONSerializable> | Error) => void} info - Log general information.
 * @property {(message: string, meta?: Record<string, JSONSerializable> | Error) => void} warn - Log warnings.
 * @property {(message: string, error?: unknown) => void} error - Log errors.
 */

/**
 * AI Service Interface
 * Interface for interactions with Local LLMs (Gemini Nano) or cloud services.
 * @typedef {Object} IAIService
 * @property {import('@lit-labs/signals').State<boolean>} isEnabled - Reactive state: true if AI features are available.
 * @property {() => Promise<string>} checkAvailability - Checks if the browser supports local AI.
 * @property {(key: string, options: any) => Promise<any>} createSession - Creates a new chat session.
 * @property {(key: string) => any} getSession - Retrieves an active session.
 * @property {(key: string) => void} destroySession - Closes a session.
 * @property {() => void} destroyAllSessions - Closes all open sessions.
 * @property {(key: string, prompt: string) => Promise<string>} getChatResponse - Helper to send a prompt and get response.
 */

/**
 * Voice Synthesis Service Interface
 * Manages Text-to-Speech (TTS) functionality.
 * @typedef {Object} IVoiceSynthesisService
 * @property {() => void} cancel - Stops current speech.
 * @property {(text: string, options?: any) => Promise<void>} speak - Speaks the provided text.
 * @property {(lang: string, preferredVoices?: string[]) => SpeechSynthesisVoice | null} getBestVoice - Finds the optimal voice for a language.
 */

/**
 * Session Service Interface
 * Manages the user's active game session and high-level routing state (Hub vs Quest).
 * @typedef {Object} ISessionService
 * @property {import('@lit-labs/signals').State<boolean>} isLoading - Global loading state.
 * @property {import('@lit-labs/signals').State<boolean>} isInHub - True if user is in the Quest Hub.
 * @property {import('@lit-labs/signals').State<Quest|null>} currentQuest - The currently active quest (if any).
 * @property {(loading: boolean) => void} setLoading - Sets global loading.
 * @property {(inHub: boolean) => void} setIsInHub - Sets Hub visibility.
 * @property {(quest: Quest|null) => void} setCurrentQuest - Sets current quest context.
 */

/**
 * Metadata for Logger entries.
 * @typedef {Record<string, JSONSerializable> | Error | undefined} LogMetadata
 */

export {};
