import { createContext } from '@lit/context';

// Manages the character's physical appearance (clothing and skin).
// Provides: suitColor (string - hex or CSS var), skinColor (string - hex)
export const suitContext = createContext(Symbol('suit-context'));
