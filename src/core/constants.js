/**
 * Theme Modes
 * @readonly
 * @enum {string}
 */
export const ThemeModes = {
	LIGHT: "light",
	DARK: "dark",
	SYSTEM: "system",
};

/**
 * Hot Switch States
 * @readonly
 * @enum {string}
 */
export const HotSwitchStates = {
	LEGACY: "legacy",
	NEW: "new",
	MOCK: "mock",
};

/**
 * Storage Keys
 * Centralized keys for localStorage/sessionStorage.
 */
export const StorageKeys = {
	PROGRESS: "legacys-end-progress",
	SETTINGS: "legacys-end-settings",
	THEME: "legacys-end-theme",
	DEBUG: "legacys-end-debug",
};

/**
 * Game Constants
 * Global configuration constants.
 */
export const GameConstants = {
	DEFAULT_LOCALE: "en",
	DEFAULT_THEME: ThemeModes.SYSTEM,
	MIN_POS: 0,
	MAX_POS: 100,
};

/**
 * Zone Types
 * @readonly
 * @enum {string}
 */
export const ZoneTypes = {
	THEME_CHANGE: "THEME_CHANGE",
	CONTEXT_CHANGE: "CONTEXT_CHANGE",
	TRAFFIC_LIGHT_CHANGE: "TRAFFIC_LIGHT_CHANGE",
	TRAFFIC_LIGHT_RED: "TRAFFIC_LIGHT_RED",
	TRAFFIC_LIGHT_GREEN: "TRAFFIC_LIGHT_GREEN",
	NONE: "NONE",
};

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
 * Traffic Light States
 * @readonly
 * @enum {string}
 */
export const TrafficLightStates = {
	GREEN: "GREEN",
	RED: "RED",
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
 * Service Types
 * @readonly
 * @enum {string}
 */
export const ServiceType = {
	LEGACY: "Legacy API",
	MOCK: "Mock Service",
	NEW: "New V2 API",
};

/**
 * Maps HotSwitchStates to their corresponding ServiceType display names.
 * @type {Record<string, string>}
 */
export const ServiceTypeMap = {
	legacy: ServiceType.LEGACY,
	new: ServiceType.NEW,
	mock: ServiceType.MOCK,
};
