import { createContext } from '@lit/context';

// Manages power indicators and magical effects.
// Provides: crystalColor (string: 'none', 'red', 'blue')
export const powerContext = createContext(Symbol('power-context'));
