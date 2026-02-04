import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").IProgressService} IProgressService
 */

/**
 * @type {import("@lit/context").Context<symbol, IProgressService>}
 */
export const progressContext = createContext(Symbol("progress-service"));
