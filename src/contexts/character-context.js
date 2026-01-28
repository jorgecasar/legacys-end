import { createContext } from "@lit/context";

/**
 * @typedef {Object} CharacterContext
 * @property {Object} [suit]
 * @property {string | null | undefined} [suit.image]
 * @property {Object} [gear]
 * @property {string | null | undefined} [gear.image]
 * @property {Object} [power]
 * @property {string} [power.effect]
 * @property {string} [power.intensity]
 * @property {Object} [mastery]
 * @property {number} [mastery.level]
 */

/** @type {import('@lit/context').Context<symbol, CharacterContext>} */
export const characterContext = createContext(Symbol("character-context"));
