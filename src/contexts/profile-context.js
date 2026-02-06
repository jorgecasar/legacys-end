import { createContext } from "@lit/context";

/** @typedef {import('../types/entities.d.js').Profile} Profile */

/** @type {import('@lit/context').Context<symbol, Profile>} */
export const profileContext = createContext(Symbol("profile-context"));
