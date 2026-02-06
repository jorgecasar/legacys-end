import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").ISessionService} ISessionService
 */

/**
 * @type {import('@lit/context').Context<symbol, ISessionService>}
 */
export const sessionContext = createContext(Symbol("session"));
