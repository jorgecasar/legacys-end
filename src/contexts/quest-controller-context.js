import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").IQuestController} IQuestController
 */

/**
 * @type {import("@lit/context").Context<symbol, IQuestController>}
 */
export const questControllerContext = createContext(Symbol("quest-controller"));
