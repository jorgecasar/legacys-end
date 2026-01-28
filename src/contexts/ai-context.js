import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").IAIService} IAIService
 */

/**
 * @type {import("@lit/context").Context<symbol, IAIService>}
 */
export const aiContext = createContext(Symbol("ai-service"));
