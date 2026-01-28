import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").IQuestController} IQuestController
 */

/**
 * @type {import("@lit/context").Context<symbol, IQuestController>}
 */
export const questControllerContext = createContext(Symbol("quest-controller"));
