import { createContext } from '@lit/context';

// Manages the character's equipment and held items.
// Provides: hasArmor (boolean), heldItem (string: 'stick', 'orb', 'scroll', 'sword'), armorColor (string)
export const gearContext = createContext(Symbol('gear-context'));
