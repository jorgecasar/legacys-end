import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").ISessionService} ISessionService
 */

/**
 * @type {import('@lit/context').Context<symbol, ISessionService>}
 */
export const sessionContext = createContext(Symbol("session"));
