import { createContext } from "@lit/context";

/**
 * @typedef {Object} CharacterContext
 * @property {Object} [suit]
 * @property {string | null | undefined} [suit.image]
 */

/** @type {import('@lit/context').Context<symbol, CharacterContext>} */
export const characterContext = createContext(Symbol("character-context"));
