/**
 * Common Type Definitions
 * Shared utility types used across the application.
 */

/**
 * Primitive JSON values.
 * Represents the basic building blocks of a JSON structure.
 * @typedef {string | number | boolean | null} JSONPrimitive
 */

/**
 * A value that can be serialized to JSON.
 * Can be a primitive, an array of serializables, or an object with string keys and serializable values.
 * Used for data storage, API payloads, and state persistence.
 * @typedef {JSONPrimitive | Array<any> | {[key: string]: any}} JSONSerializable
 */

/**
 * Legacy alias for JSONSerializable.
 * @deprecated Use JSONSerializable instead for clarity.
 * @typedef {JSONSerializable} JsonValue
 */

/**
 * A 2D vector representing position or dimensions in 2D space.
 * Used for coordinate systems, entity positioning, and UI layout.
 * @typedef {Object} Vector2
 * @property {number} x - The X coordinate (horizontal axis)
 * @property {number} y - The Y coordinate (vertical axis)
 */

/**
 * Dimensions object representing width and height.
 * Common standard for 2D size definitions.
 * @typedef {Object} Size
 * @property {number} width - The width in pixels or units.
 * @property {number} height - The height in pixels or units.
 */

/**
 * Rectangular area definition.
 * Combines position (from Vector2) and dimensions (from Size).
 * Used for bounding boxes, collision areas, and UI regions.
 * @typedef {Vector2 & Size} Rect
 */

export {};
