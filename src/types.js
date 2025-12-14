

export const ServiceType = {
	LEGACY: 'Legacy API',
	MOCK: 'Mock Service',
	NEW: 'New V2 API',
};

/**
 * @typedef {Object} GameStats
 * @property {number} maintainability
 * @property {number} portability
 */

/**
 * @typedef {Object} UserData
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {number} hp
 * @property {string} avatarColor
 */

/**
 * @typedef {Object} IUserService
 * @property {function(number): Promise<UserData>} fetchUserData
 * @property {function(): string} getServiceName
 */

/**
 * @typedef {Object} Coordinate
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Zone
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {string} [label]
 */

/**
 * @typedef {Object} HeroConfig
 * @property {string} image
 * @property {string} [reward]
 */

/**
 * @typedef {Object} RewardConfig
 * @property {string} name
 * @property {string} icon
 * @property {string} image
 * @property {Coordinate} position
 */

/**
 * @typedef {Object} NpcConfig
 * @property {string} name
 * @property {string} icon
 * @property {string} image
 * @property {Coordinate} position
 */

/**
 * @typedef {Object} CodeSnippet
 * @property {string} title
 * @property {string} code
 */

/**
 * @typedef {Object} CodeSnippetsConfig
 * @property {CodeSnippet[]} [start]
 * @property {CodeSnippet[]} [end]
 */

/**
 * @typedef {Object} LevelConfig
 * @property {string} id
 * @property {number} [powerLevel]
 * @property {string} title
 * @property {string} description
 * @property {string} [problemTitle]
 * @property {string} [problemDesc]
 * @property {string} [solutionTitle]
 * @property {string} [solutionDesc]
 * @property {string[]} [architecturalChanges]
 * @property {CodeSnippetsConfig} [codeSnippets]
 * @property {GameStats} stats
 * @property {string} [serviceType]
 * @property {Coordinate} startPos
 * @property {Zone} [exitZone]
 * @property {string} [backgroundStyle]
 * @property {string} [postDialogBackgroundStyle]
 * @property {NpcConfig} [npc]
 * @property {RewardConfig} [reward]
 * @property {HeroConfig} [hero]
 * @property {boolean} [hasHotSwitch]
 * @property {boolean} [isFinalBoss]
 */
