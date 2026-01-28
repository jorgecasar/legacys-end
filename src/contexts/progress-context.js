import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/progress-service.js").ProgressService} ProgressService
 */

/**
 * @type {import("@lit/context").Context<symbol, ProgressService>}
 */
export const progressContext = createContext(Symbol("progress-service"));
