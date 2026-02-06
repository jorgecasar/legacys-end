import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").IAIService} IAIService
 */

/**
 * @type {import("@lit/context").Context<symbol, IAIService>}
 */
export const aiContext = createContext(Symbol("ai-service"));
