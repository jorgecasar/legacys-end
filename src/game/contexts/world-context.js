/** @typedef {import('../../types/game.d.js').IWorldStateService} IWorldStateService */

import { createContext } from "@lit/context";

export const worldStateContext = createContext(Symbol("world-state"));
