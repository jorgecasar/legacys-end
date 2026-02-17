import { createContext } from "@lit/context";

/** @typedef {import('../core/entities.js').Profile} Profile */

/** @type {import('@lit/context').Context<symbol, Profile>} */
export const profileContext = createContext(Symbol("profile-context"));
