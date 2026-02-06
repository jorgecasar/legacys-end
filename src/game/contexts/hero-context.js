/** @typedef {import('../../types/game.d.js').IHeroStateService} IHeroStateService */

import { createContext } from "@lit/context";

export const heroStateContext = createContext(Symbol("hero-state"));
