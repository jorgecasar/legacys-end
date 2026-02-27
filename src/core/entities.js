/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} HeroState
 * @property {Position} pos
 * @property {string} hotSwitchState
 * @property {boolean} isEvolving
 * @property {string} imageSrc
 */

/**
 * @typedef {Object} QuestState
 * @property {boolean} hasCollectedItem
 * @property {boolean} isRewardCollected
 * @property {boolean} isQuestCompleted
 * @property {string|null} currentChapterId
 * @property {string|null} lockedMessage
 */

/**
 * @typedef {Object} Profile
 * @property {string} [name] - The display name of the user/hero.
 * @property {string} [role] - The selected role or class (e.g., 'Developer', 'Designer').
 * @property {boolean} [loading] - Indicates if the profile data is currently being fetched.
 * @property {string|null} [error] - Error message if profile loading or update failed.
 * @property {string} [serviceName] - The name of the remote service providing this profile (e.g., 'GitHub', 'Google').
 */

/**
 * @typedef {Object} Chapter
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} objective
 */

/**
 * @typedef {Object} Quest
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Chapter[]} chapters
 * @property {QuestState} state
 */

export {};
