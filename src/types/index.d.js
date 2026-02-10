/**
 * @template T, E
 * @typedef {{ ok: true, value: T } | { ok: false, error: E }} Result
 */

/**
 * @typedef {Object} AppError
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {any} [details] - Optional error details
 */

/**
 * @typedef {import('@lit-labs/signals').Signal.State<T>} SignalState<T>
 * @template T
 */

/**
 * @typedef {Object} GameState
 * @property {HeroState} hero
 * @property {QuestState} quest
 * @property {WorldState} world
 */

/**
 * @typedef {Object} HeroState
 * @property {SignalState<{x: number, y: number}>} pos
 * @property {SignalState<import('./game.d.js').HotSwitchState>} hotSwitchState
 * @property {SignalState<boolean>} isEvolving
 * @property {SignalState<string>} imageSrc
 */

/**
 * @typedef {Object} QuestState
 * @property {SignalState<boolean>} hasCollectedItem
 * @property {SignalState<boolean>} isRewardCollected
 * @property {SignalState<boolean>} isQuestCompleted
 * @property {SignalState<string|null>} lockedMessage
 * @property {SignalState<number>} currentChapterNumber
 * @property {SignalState<number>} totalChapters
 * @property {SignalState<string | import('lit').TemplateResult>} levelTitle
 * @property {SignalState<string | import('lit').TemplateResult>} questTitle
 * @property {SignalState<string|null>} currentChapterId
 */

/**
 * @typedef {Object} ILoggerService
 * @property {(message: string, ...args: any[]) => void} error
 * @property {(message: string, ...args: any[]) => void} warn
 * @property {(message: string, ...args: any[]) => void} info
 * @property {(message: string, ...args: any[]) => void} debug
 */

/**
 * @typedef {string | number | boolean | null | { [key: string]: any } | any[]} JSONSerializable
 */

/**
 * @typedef {Object} IStorageAdapter
 * @property {(key: string) => JSONSerializable | null} getItem
 * @property {(key: string, value: JSONSerializable) => void} setItem
 * @property {(key: string) => void} removeItem
 * @property {() => void} clear
 */

/**
 * @typedef {Object} WorldState
 * @property {SignalState<boolean>} isPaused
 * @property {SignalState<boolean>} showDialog
 * @property {SignalState<string>} currentDialogText
 * @property {SignalState<string>} nextDialogText
 * @property {SignalState<number>} currentSlideIndex
 */
