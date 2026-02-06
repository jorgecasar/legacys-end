import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").IProgressService} IProgressService
 */

/**
 * @type {import("@lit/context").Context<symbol, IProgressService>}
 */
export const progressContext = createContext(Symbol("progress-service"));
