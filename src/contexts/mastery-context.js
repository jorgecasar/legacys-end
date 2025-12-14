import { createContext } from '@lit/context';

// Manages the game mastery state and final victory conditions.
// Provides: isMaster (boolean), legacyMode (boolean - true if using New API)
export const masteryContext = createContext(Symbol('mastery-context'));
