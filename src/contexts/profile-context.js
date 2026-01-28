import { createContext } from "@lit/context";

/**
 * @typedef {Object} Profile
 * @property {string} [name] - The name of the profile
 * @property {string} [role] - The role of the profile
 * @property {boolean} [loading] - Whether the profile is loading
 * @property {string|null} [error] - The error of the profile
 * @property {string} [serviceName] - The name of the service
 */

/** @type {import('@lit/context').Context<symbol, Profile>} */
export const profileContext = createContext(Symbol("profile-context"));
