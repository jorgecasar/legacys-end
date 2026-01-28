import { createContext } from "@lit/context";

/**
 * @typedef {Object} DialogState
 * @property {boolean} isDialogOpen - Whether any dialog is currently active
 * @property {boolean} isRewardCollected - Whether the chapter reward has been collected
 * @property {string|null} npcName - The name of the current NPC in dialog
 * @property {string|null} exitZoneName - The name of the exit zone if applicable
 * @property {string|null} chapterTitle - The current chapter title
 * @property {string|null} currentDialogText - The text currently being displayed in the dialog
 * @property {string|null} [nextDialogText] - The pre-fetched next dialog text
 */

/** @type {import('@lit/context').Context<symbol, DialogState>} */
export const dialogStateContext = createContext(Symbol("dialog-state"));
