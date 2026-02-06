/** @typedef {import('../../types/game.d.js').IQuestStateService} IQuestStateService */

import { createContext } from "@lit/context";

export const questStateContext = createContext(Symbol("quest-state"));
